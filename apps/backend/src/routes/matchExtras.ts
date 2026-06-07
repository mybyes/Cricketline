import { FastifyInstance } from 'fastify'
import {
  getMatchBbb,
  getMatchHistory,
  getMatchSquad,
} from '../services/cricapi'
import { CACHE_KEYS, SQUAD_TTL, BBB_TTL, HISTORY_TTL, cached, withStaleFallback } from '../services/cache'
import { sendOrStale } from './staleCatch'

export default async function matchExtrasRoute(app: FastifyInstance) {
  app.get<{ Params: { id: string } }>('/match/:id/squad', async (req, reply) => {
    const { id } = req.params
    const key = CACHE_KEYS.squad(id)
    try {
      const { data, stale } = await withStaleFallback(app.redis, key, () =>
        cached(app.redis, key, SQUAD_TTL, () => getMatchSquad(id))
      )
      return { success: true, data, stale: stale ?? false }
    } catch (e: any) {
      return sendOrStale(app.redis, key, e, reply)
    }
  })

  app.get<{ Params: { id: string } }>('/match/:id/bbb', async (req, reply) => {
    const { id } = req.params
    const key = CACHE_KEYS.bbb(id)
    try {
      const { data, stale } = await withStaleFallback(app.redis, key, () =>
        cached(app.redis, key, BBB_TTL, () => getMatchBbb(id))
      )
      return { success: true, data, stale: stale ?? false }
    } catch (e: any) {
      return sendOrStale(app.redis, key, e, reply)
    }
  })

  app.get<{ Params: { id: string } }>('/match/:id/history', async (req, reply) => {
    const { id } = req.params
    const key = CACHE_KEYS.history(id)
    try {
      const { data, stale } = await withStaleFallback(app.redis, key, () =>
        cached(app.redis, key, HISTORY_TTL, () => getMatchHistory(id, app.redis))
      )
      return { success: true, data, stale: stale ?? false }
    } catch (e: any) {
      return sendOrStale(app.redis, key, e, reply)
    }
  })
}
