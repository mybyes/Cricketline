import 'dotenv/config'
import Fastify, { type FastifyError } from 'fastify'
import cookie from '@fastify/cookie'
import cors from '@fastify/cors'
import helmet from '@fastify/helmet'
import rateLimit from '@fastify/rate-limit'
import { Redis } from 'ioredis'
import { isMemoryRedisUrl, MemoryRedis } from './lib/memoryRedis'
import { initDb } from './db'
import authRoute from './routes/auth'
import matchesRoute from './routes/matches'
import scoreRoute from './routes/score'
import matchExtrasRoute from './routes/matchExtras'
import seriesRoute from './routes/series'
import favoritesRoute from './routes/favorites'
import devicesRoute from './routes/devices'
import commentsRoute from './routes/comments'
import pollRoute from './routes/poll'
import dailyRoute from './routes/daily'
import portalRoute from './routes/portal'
import searchRoute from './routes/search'
import streamRoute from './routes/stream'
import oddsRoute from './routes/odds'
import intelligenceRoute from './routes/intelligence'
import { clientCount, initRealtime, publishOdds, publishScores } from './services/realtime'
import { getLiveMatches } from './services/cricapi'
import { cached, CACHE_KEYS, LIVE_MATCHES_TTL } from './services/cache'
import { getLiveOddsBoards, oddsFeedConfigured } from './services/odds'
import { cricketSeriesCoverage, theOddsConfigured } from './services/theOddsApi'
import { initStoreRedis, rebuildMatchFanIndex } from './services/store'
import { initCommentsRedis } from './services/comments'
import { initPollRedis } from './services/poll'
import { initUsersRedis } from './services/users'
import { warmCaches } from './services/cacheWarmer'
import { startWicketWatcher } from './services/wicketWatcher'
import { SEED_MODE } from './services/cricapi'

const cricApiKey = process.env.CRICAPI_KEY
// Local/dev: missing Redis → in-memory store (true zero-config). Production should set a real URL.
const redisUrl = (() => {
  const raw = (process.env.UPSTASH_REDIS_URL ?? '').trim()
  if (!raw || raw.includes('your_upstash_url_here')) {
    console.warn('⚠ UPSTASH_REDIS_URL unset — using memory:// (demo/local only)')
    return 'memory://'
  }
  return raw
})()
// No key required: the app runs in seed/demo mode (built-in dataset). Set a real
// CRICAPI_KEY (and leave SEED_DATA unset) to serve live data at the final stage.
if (SEED_MODE) {
  console.warn('⚠ Running in SEED mode — serving built-in demo data, not live CricAPI. Set CRICAPI_KEY for live data.')
} else if (cricApiKey?.includes('your_cricapi_key_here')) {
  console.error('CRICAPI_KEY is still the placeholder — set a real key or unset it to use seed mode')
  process.exit(1)
}

// trustProxy: behind Railway's proxy so rate-limit/IP logging see the real client IP.
const app = Fastify({ logger: true, trustProxy: true, bodyLimit: 256 * 1024 })

// Sanitized errors — log the real error server-side, return a generic message to clients.
app.setErrorHandler((err: FastifyError, req, reply) => {
  req.log.error({ err }, 'request error')
  const status = err.statusCode && err.statusCode >= 400 && err.statusCode < 500 ? err.statusCode : 500
  reply.status(status).send({
    success: false,
    error: status < 500 ? err.message : 'Internal server error',
  })
})

const redis = (isMemoryRedisUrl(redisUrl)
  ? new MemoryRedis()
  : new Redis(redisUrl, { maxRetriesPerRequest: 3 })) as unknown as Redis
if (isMemoryRedisUrl(redisUrl)) {
  console.warn('⚠ Using in-memory Redis (memory://) — fine for local seed/demo; not for production.')
}
app.decorate('redis', redis)
initStoreRedis(redis)
initCommentsRedis(redis)
initPollRedis(redis)
initUsersRedis(redis)
initRealtime(redis)

async function start() {
  const dbReady = await initDb()
  await rebuildMatchFanIndex()
  app.log.info(dbReady ? 'PostgreSQL connected' : 'Using Redis for favorites (set DATABASE_URL for Postgres)')

  // CORS: lock to ALLOWED_ORIGINS (comma-separated) in prod; reflect the caller in dev/demo.
  // credentials:true lets the web app send the httpOnly session cookie cross-origin — which
  // requires a specific origin (not '*'), so set ALLOWED_ORIGINS in production for sign-in.
  const allowed = (process.env.ALLOWED_ORIGINS ?? '').split(',').map((o) => o.trim()).filter(Boolean)
  // Only allow credentialed (cookie) requests when origins are pinned — never reflect an
  // arbitrary origin AND allow credentials. Mobile uses a Bearer token, so it's unaffected.
  await app.register(cors, { origin: allowed.length ? allowed : true, credentials: allowed.length > 0 })
  await app.register(cookie)
  await app.register(helmet, { contentSecurityPolicy: false })
  // App polls ~12 req/min per screen; 10/min caused 429s and blank UIs. Per-IP, overridable
  // via RATE_LIMIT_MAX (raise for load testing, lower to tighten).
  await app.register(rateLimit, {
    max: Number(process.env.RATE_LIMIT_MAX) || 200,
    timeWindow: '1 minute',
    ban: 0,
    errorResponseBuilder: () => ({
      success: false,
      error: 'Too many requests — wait a moment and retry. Cached scores may still be available.',
    }),
  })
  app.register(authRoute)
  app.register(matchesRoute)
  app.register(scoreRoute)
  app.register(matchExtrasRoute)
  app.register(seriesRoute)
  app.register(favoritesRoute)
  app.register(devicesRoute)
  app.register(commentsRoute)
  app.register(pollRoute)
  app.register(dailyRoute)
  app.register(portalRoute)
  app.register(searchRoute)
  app.register(streamRoute)
  app.register(oddsRoute)
  app.register(intelligenceRoute)

  warmCaches(redis, app.log).catch(() => {})
  // Push / wicket alerts off by default (lightweight info app). Set PUSH_ENABLED=1 to turn on.
  const pushOn = /^(1|true|yes)$/i.test(process.env.PUSH_ENABLED ?? '')
  if (pushOn) {
    startWicketWatcher(redis, app.log)
    app.log.info('Wicket push alerts enabled (PUSH_ENABLED=1)')
  } else {
    app.log.info('Wicket push alerts disabled (set PUSH_ENABLED=1 to enable)')
  }

  // Publisher tick — the near-zero-cost hot loop. Three guards keep it off the API quota
  // and the Upstash command budget:
  //   1. No SSE clients connected → don't fetch or publish at all (most of the day).
  //   2. Read live matches through the cache (shared key, LIVE_MATCHES_TTL) so upstream is
  //      hit at most once per TTL no matter the tick rate — not once per 8s.
  //   3. Publish only when the snapshot actually changed (skip redundant PUBLISH + fan-out).
  let lastLiveSig = ''
  let lastOddsSig = ''
  async function liveTick() {
    if (clientCount() === 0) return
    // `cached` returns { data, stale, cachedAt } — publish the Match[] payload only.
    const { data: live } = await cached(redis, CACHE_KEYS.liveMatches(), LIVE_MATCHES_TTL, () => getLiveMatches(redis))
    const sig = JSON.stringify(live)
    if (sig !== lastLiveSig) {
      lastLiveSig = sig
      publishScores({ data: live, ts: Date.now() })
    }

    // Display-only markets: publish whenever boards change (seed simulator jitters each tick).
    const boards = await getLiveOddsBoards(
      live.map((m) => m.id),
      live.map((m) => ({ id: m.id, teams: m.teams ?? [] })),
    )
    if (!boards.length) return
    const oddsSig = JSON.stringify(boards.map((b) => ({
      id: b.matchId,
      at: b.updatedAt,
      m: b.matchOdds.map((o) => o.back),
      s: b.sessions.map((x) => [x.line, x.yes, x.no]),
    })))
    if (oddsSig === lastOddsSig) return
    lastOddsSig = oddsSig
    publishOdds({ data: boards, ts: Date.now(), displayOnly: true })
  }
  setInterval(() => { liveTick().catch(() => { /* skip tick */ }) }, 8_000)

  app.get('/', async () => ({
    service: 'Cricket Pulse API',
    status: 'ok',
    docs: {
      health: '/health',
      live: '/matches/live',
      recent: '/matches/recent',
      upcoming: '/matches/upcoming',
      score: '/match/:id/score',
      odds: '/match/:id/odds',
      oddsLive: '/odds/live',
      intelligenceLive: '/intelligence/live',
      stream: '/stream',
      series: '/series',
    },
  }))

  app.get('/health', async (_req, reply) => {
    const redisOk = await redis.ping().then(() => true).catch(() => false)
    const ok = redisOk // Postgres is optional (Redis fallback), so it doesn't gate health
    reply.status(ok ? 200 : 503).send({
      status: ok ? 'ok' : 'degraded',
      ts: Date.now(),
      db: dbReady ? 'postgres' : 'redis',
      redis: redisOk ? 'up' : 'down',
      mode: SEED_MODE ? 'seed' : 'live',
      odds: oddsFeedConfigured()
        ? (theOddsConfigured() ? 'the-odds-api' : 'feed')
        : (SEED_MODE ? 'seed' : 'unset'),
      cricketSeries: theOddsConfigured() ? cricketSeriesCoverage() : undefined,
      push: pushOn ? 'on' : 'off',
    })
  })

  app.listen({ port: Number(process.env.PORT) || 3000, host: '0.0.0.0' }, (err) => {
    if (err) { app.log.error(err); process.exit(1) }
  })
}

// Graceful shutdown — close HTTP server + Redis on deploy/restart so in-flight work drains.
for (const sig of ['SIGTERM', 'SIGINT'] as const) {
  process.on(sig, async () => {
    app.log.info(`${sig} received — shutting down`)
    try { await app.close(); redis.disconnect() } finally { process.exit(0) }
  })
}

start()
