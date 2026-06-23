import { FastifyInstance } from 'fastify'
import { getMatchScore, scorecardFromMatch } from '../services/cricapi'
import type { Match } from '../services/cricapi'
import {
  apiPayload,
  cached,
  CACHE_KEYS,
  readCache,
  SCORECARD_TTL,
} from '../services/cache'
import { validateIdParam } from '../lib/validateId'

async function scoreFromAllMatches(redis: FastifyInstance['redis'], matchId: string) {
  const all = await readCache<Match[]>(redis, CACHE_KEYS.allMatches())
  const m = all?.data?.find((row) => row.id === matchId)
  if (!m) return null
  return { data: scorecardFromMatch(m), cachedAt: all!.cachedAt }
}

export default async function scoreRoute(app: FastifyInstance) {
  app.get<{ Params: { id: string } }>('/match/:id/score', { preHandler: validateIdParam }, async (req, reply) => {
    const { id } = req.params
    const key = CACHE_KEYS.scorecard(id)
    try {
      const result = await cached(app.redis, key, SCORECARD_TTL, () => getMatchScore(id))
      return apiPayload(result)
    } catch (e) {
      app.log.warn({ err: e, matchId: id }, 'scorecard fallback')
      const hit = await readCache<Awaited<ReturnType<typeof getMatchScore>>>(app.redis, key)
      if (hit) {
        return { success: true, data: hit.data, stale: true, cachedAt: hit.cachedAt }
      }
      const stub = await scoreFromAllMatches(app.redis, id)
      if (stub) {
        return { success: true, data: stub.data, stale: true, cachedAt: stub.cachedAt }
      }
      reply.status(404).send({ success: false, error: 'Scorecard not available' })
    }
  })
}
