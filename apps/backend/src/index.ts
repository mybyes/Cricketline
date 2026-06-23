import 'dotenv/config'
import Fastify, { type FastifyError } from 'fastify'
import cors from '@fastify/cors'
import helmet from '@fastify/helmet'
import rateLimit from '@fastify/rate-limit'
import { Redis } from 'ioredis'
import { initDb } from './db'
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
import { initStoreRedis, rebuildMatchFanIndex } from './services/store'
import { initCommentsRedis } from './services/comments'
import { initPollRedis } from './services/poll'
import { warmCaches } from './services/cacheWarmer'
import { startWicketWatcher } from './services/wicketWatcher'
import { SEED_MODE } from './services/cricapi'

const redisUrl = process.env.UPSTASH_REDIS_URL
const cricApiKey = process.env.CRICAPI_KEY

if (!redisUrl || redisUrl.includes('your_upstash_url_here')) {
  console.error('Missing UPSTASH_REDIS_URL — set it in apps/backend/.env')
  process.exit(1)
}
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

const redis = new Redis(redisUrl, { maxRetriesPerRequest: 3 })
app.decorate('redis', redis)
initStoreRedis(redis)
initCommentsRedis(redis)
initPollRedis(redis)

async function start() {
  const dbReady = await initDb()
  await rebuildMatchFanIndex()
  app.log.info(dbReady ? 'PostgreSQL connected' : 'Using Redis for favorites (set DATABASE_URL for Postgres)')

  // CORS: lock to ALLOWED_ORIGINS (comma-separated) in prod; '*' when unset (dev/demo).
  const allowed = (process.env.ALLOWED_ORIGINS ?? '').split(',').map((o) => o.trim()).filter(Boolean)
  await app.register(cors, { origin: allowed.length ? allowed : '*' })
  await app.register(helmet, { contentSecurityPolicy: false })
  // App polls ~12 req/min per screen; 10/min caused 429s and blank UIs
  await app.register(rateLimit, {
    max: 200,
    timeWindow: '1 minute',
    ban: 0,
    errorResponseBuilder: () => ({
      success: false,
      error: 'Too many requests — wait a moment and retry. Cached scores may still be available.',
    }),
  })
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

  warmCaches(redis, app.log).catch(() => {})
  startWicketWatcher(redis, app.log)

  app.get('/', async () => ({
    service: 'CricketFast API',
    status: 'ok',
    docs: {
      health: '/health',
      live: '/matches/live',
      recent: '/matches/recent',
      upcoming: '/matches/upcoming',
      score: '/match/:id/score',
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
