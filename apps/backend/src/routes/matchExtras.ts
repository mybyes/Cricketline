import { FastifyInstance } from 'fastify'
import { getMatchBbb, getMatchHistory, getMatchSquad } from '../services/cricapi'
import {
  apiPayload, apiPayloadOrCache, cached, CACHE_KEYS, SQUAD_TTL, BBB_TTL, HISTORY_TTL,
} from '../services/cache'
import { validateIdParam } from '../lib/validateId'

export default async function matchExtrasRoute(app: FastifyInstance) {
  app.get<{ Params: { id: string } }>('/match/:id/squad', { preHandler: validateIdParam }, async (req, reply) => {
    const { id } = req.params
    const key = CACHE_KEYS.squad(id)
    try {
      const result = await cached(app.redis, key, SQUAD_TTL, () => getMatchSquad(id))
      return apiPayload(result)
    } catch (e) {
      app.log.warn({ err: e, matchId: id }, 'squad fallback')
      return apiPayloadOrCache(app.redis, key, null, [])
    }
  })

  app.get<{ Params: { id: string } }>('/match/:id/bbb', { preHandler: validateIdParam }, async (req, reply) => {
    const { id } = req.params
    const key = CACHE_KEYS.bbb(id)
    try {
      const result = await cached(app.redis, key, BBB_TTL, () => getMatchBbb(id))
      return apiPayload(result)
    } catch (e) {
      app.log.warn({ err: e, matchId: id }, 'bbb fallback')
      return apiPayloadOrCache(app.redis, key, null, [])
    }
  })

  app.get<{ Params: { id: string } }>('/match/:id/history', { preHandler: validateIdParam }, async (req, reply) => {
    const { id } = req.params
    const key = CACHE_KEYS.history(id)
    try {
      const result = await cached(app.redis, key, HISTORY_TTL, () => getMatchHistory(id, app.redis))
      return apiPayload(result)
    } catch (e) {
      app.log.warn({ err: e, matchId: id }, 'history fallback')
      return apiPayloadOrCache(app.redis, key, null, { headToHead: [], team1Recent: [], team2Recent: [], teams: [] })
    }
  })
}
