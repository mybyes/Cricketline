import type { FastifyBaseLogger } from 'fastify'
import type { Redis } from 'ioredis'
import { cached, CACHE_KEYS, LIVE_MATCHES_TTL } from './cache'
import { getLiveMatches } from './cricapi'
import { processWicketAlerts } from './wicketAlerts'

const TICK_MS = 15_000

/** Background poll — mirrors /matches/live refresh and checks wicket counts. */
export function startWicketWatcher(redis: Redis, log: FastifyBaseLogger) {
  const tick = async () => {
    try {
      const { data: live } = await cached(redis, CACHE_KEYS.liveMatches(), LIVE_MATCHES_TTL, () => getLiveMatches(redis))
      await processWicketAlerts(redis, live, log)
    } catch (e) {
      log.warn({ err: e }, 'wicket watcher tick failed')
    }
  }

  setTimeout(tick, 8_000)
  setInterval(tick, TICK_MS)
}
