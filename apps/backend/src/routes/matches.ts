import { FastifyInstance } from 'fastify'
import { getLiveMatches, getUpcomingMatches } from '../services/cricapi'
import { cached, CACHE_KEYS, LIVE_MATCHES_TTL, SCHEDULE_TTL } from '../services/cache'

export default async function matchesRoute(app: FastifyInstance) {
  app.get('/matches/live', async (req, reply) => {
    try {
      const data = await cached(
        app.redis,
        CACHE_KEYS.liveMatches(),
        LIVE_MATCHES_TTL,
        getLiveMatches
      )
      return { success: true, data }
    } catch (e: any) {
      reply.status(500).send({ success: false, error: e.message })
    }
  })

  app.get('/matches/upcoming', async (req, reply) => {
    try {
      const data = await cached(
        app.redis,
        CACHE_KEYS.schedule(),
        SCHEDULE_TTL,
        getUpcomingMatches
      )
      return { success: true, data }
    } catch (e: any) {
      reply.status(500).send({ success: false, error: e.message })
    }
  })
}
