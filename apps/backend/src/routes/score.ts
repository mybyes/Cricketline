import { FastifyInstance } from 'fastify'
import { getMatchScore } from '../services/cricapi'
import { cached, CACHE_KEYS, SCORECARD_TTL } from '../services/cache'

export default async function scoreRoute(app: FastifyInstance) {
  app.get<{ Params: { id: string } }>('/match/:id/score', async (req, reply) => {
    const { id } = req.params
    try {
      const data = await cached(
        app.redis,
        CACHE_KEYS.scorecard(id),
        SCORECARD_TTL,
        () => getMatchScore(id)
      )
      return { success: true, data }
    } catch (e: any) {
      reply.status(500).send({ success: false, error: e.message })
    }
  })
}
