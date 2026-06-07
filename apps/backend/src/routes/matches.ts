import { FastifyInstance } from 'fastify'
import { getLiveMatches, getRecentMatches, getUpcomingMatches } from '../services/cricapi'
import {
  apiPayload,
  apiPayloadOrCache,
  cached,
  CACHE_KEYS,
  filterLiveMatches,
  filterRecentMatches,
  filterUpcomingMatches,
  LIVE_MATCHES_TTL,
  RECENT_TTL,
  SCHEDULE_TTL,
  resolveMatchListFallback,
} from '../services/cache'
import { processWicketAlerts } from '../services/wicketAlerts'

export default async function matchesRoute(app: FastifyInstance) {
  app.get('/matches/live', async () => {
    const key = CACHE_KEYS.liveMatches()
    try {
      const result = await cached(app.redis, key, LIVE_MATCHES_TTL, async () => {
        const data = await getLiveMatches(app.redis)
        await processWicketAlerts(app.redis, data, app.log).catch((e) => {
          app.log.warn({ err: e }, 'wicket alert check failed')
        })
        return data
      })
      if (!result.data.length) {
        const fallback = await resolveMatchListFallback(app.redis, key, filterLiveMatches)
        if (fallback) return { success: true as const, data: fallback.data, stale: true, cachedAt: fallback.cachedAt }
      }
      return apiPayload(result)
    } catch (e) {
      app.log.warn({ err: e }, 'live matches fallback')
      return apiPayloadOrCache(app.redis, key, null, [], filterLiveMatches)
    }
  })

  app.get('/matches/recent', async () => {
    const key = CACHE_KEYS.recentMatches()
    try {
      const result = await cached(app.redis, key, RECENT_TTL, () => getRecentMatches(app.redis))
      if (!result.data.length) {
        const fallback = await resolveMatchListFallback(app.redis, key, (all) => filterRecentMatches(all))
        if (fallback) return { success: true as const, data: fallback.data, stale: true, cachedAt: fallback.cachedAt }
      }
      return apiPayload(result)
    } catch (e) {
      app.log.warn({ err: e }, 'recent matches fallback')
      return apiPayloadOrCache(app.redis, key, null, [], (all) => filterRecentMatches(all))
    }
  })

  app.get('/matches/upcoming', async () => {
    const key = CACHE_KEYS.schedule()
    try {
      const result = await cached(app.redis, key, SCHEDULE_TTL, () => getUpcomingMatches(app.redis))
      if (!result.data.length) {
        const fallback = await resolveMatchListFallback(app.redis, key, filterUpcomingMatches)
        if (fallback) return { success: true as const, data: fallback.data, stale: true, cachedAt: fallback.cachedAt }
      }
      return apiPayload(result)
    } catch (e) {
      app.log.warn({ err: e }, 'upcoming matches fallback')
      return apiPayloadOrCache(app.redis, key, null, [], filterUpcomingMatches)
    }
  })
}
