import type { FastifyBaseLogger } from 'fastify'
import type { Redis } from 'ioredis'
import { cached, CACHE_KEYS, LIVE_MATCHES_TTL } from './cache'
import { getLiveMatches } from './cricapi'
import { processWicketAlerts } from './wicketAlerts'

const FAST_MS = 15_000   // a match is live — check often for wickets
const IDLE_MS = 300_000  // nothing live — check every 5 min (saves API + Upstash commands)

/**
 * Background poll for wicket push-alerts. Self-paces: ticks fast while any match is live,
 * and backs off to every 5 minutes when nothing is live — which is most of the day, so this
 * keeps the loop well within the Upstash free command budget. Runs independently of SSE
 * clients (alerts must fire even with the app closed).
 */
export function startWicketWatcher(redis: Redis, log: FastifyBaseLogger) {
  let timer: ReturnType<typeof setTimeout> | null = null

  const tick = async () => {
    let liveCount = 0
    try {
      const { data: live } = await cached(redis, CACHE_KEYS.liveMatches(), LIVE_MATCHES_TTL, () => getLiveMatches(redis))
      liveCount = live.length
      await processWicketAlerts(redis, live, log)
    } catch (e) {
      log.warn({ err: e }, 'wicket watcher tick failed')
    } finally {
      timer = setTimeout(tick, liveCount > 0 ? FAST_MS : IDLE_MS)
    }
  }

  timer = setTimeout(tick, 8_000)
  return () => { if (timer) clearTimeout(timer) }
}
