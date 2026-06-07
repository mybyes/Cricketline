import { FastifyInstance } from 'fastify'
import { getMatchScore } from '../services/cricapi'
import { cached, CACHE_KEYS, SCORECARD_TTL, withStaleFallback } from '../services/cache'
import { sendOrStale } from './staleCatch'

export default async function scoreRoute(app: FastifyInstance) {
  app.get<{ Params: { id: string } }>('/match/:id/score', async (req, reply) => {
    const { id } = req.params
    const key = CACHE_KEYS.scorecard(id)
    try {
      const { data, stale } = await withStaleFallback(
        app.redis,
        key,
        () => cached(app.redis, key, SCORECARD_TTL, () => getMatchScore(id))
      )
      return { success: true, data, stale: stale ?? false }
    } catch (e: any) {
      return sendOrStale(app.redis, key, e, reply)
    }
  })
}
