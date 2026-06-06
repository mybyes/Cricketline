import { FastifyInstance } from 'fastify'
import { getLiveMatches, getRecentMatches, getUpcomingMatches } from '../services/cricapi'
import { cached, CACHE_KEYS, LIVE_MATCHES_TTL, RECENT_TTL, SCHEDULE_TTL, withStaleFallback } from '../services/cache'

export default async function matchesRoute(app: FastifyInstance) {
  app.get('/matches/live', async (req, reply) => {
    try {
      const { data, stale } = await withStaleFallback(
        app.redis,
        CACHE_KEYS.liveMatches(),
        () => cached(app.redis, CACHE_KEYS.liveMatches(), LIVE_MATCHES_TTL, getLiveMatches)
      )
      return { success: true, data, stale: stale ?? false }
    } catch (e: any) {
      reply.status(500).send({ success: false, error: e.message })
    }
  })

  app.get('/matches/recent', async (req, reply) => {
    try {
      const { data, stale } = await withStaleFallback(
        app.redis,
        CACHE_KEYS.recentMatches(),
        () => cached(app.redis, CACHE_KEYS.recentMatches(), RECENT_TTL, () => getRecentMatches())
      )
      return { success: true, data, stale: stale ?? false }
    } catch (e: any) {
      reply.status(500).send({ success: false, error: e.message })
    }
  })

  app.get('/matches/upcoming', async (req, reply) => {
    try {
      const { data, stale } = await withStaleFallback(
        app.redis,
        CACHE_KEYS.schedule(),
        () => cached(app.redis, CACHE_KEYS.schedule(), SCHEDULE_TTL, getUpcomingMatches)
      )
      return { success: true, data, stale: stale ?? false }
    } catch (e: any) {
      reply.status(500).send({ success: false, error: e.message })
    }
  })
}
