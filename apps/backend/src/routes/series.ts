import { FastifyInstance } from 'fastify'
import { getSeriesList, getSeriesTable } from '../services/cricapi'
import {
  apiPayload, apiPayloadOrCache, cached, CACHE_KEYS, SERIES_LIST_TTL, SERIES_TABLE_TTL,
} from '../services/cache'
import { validateIdParam } from '../lib/validateId'

export default async function seriesRoute(app: FastifyInstance) {
  app.get('/series', async (req, reply) => {
    const key = CACHE_KEYS.seriesList()
    try {
      const result = await cached(app.redis, key, SERIES_LIST_TTL, () => getSeriesList())
      return apiPayload(result)
    } catch (e) {
      app.log.warn({ err: e }, 'series list fallback')
      return apiPayloadOrCache(app.redis, key, null, [])
    }
  })

  app.get<{ Params: { id: string } }>('/series/:id/table', { preHandler: validateIdParam }, async (req, reply) => {
    const { id } = req.params
    const key = CACHE_KEYS.seriesTable(id)
    try {
      const result = await cached(app.redis, key, SERIES_TABLE_TTL, () => getSeriesTable(id))
      return apiPayload(result)
    } catch (e) {
      app.log.warn({ err: e, seriesId: id }, 'series table fallback')
      return apiPayloadOrCache(app.redis, key, null, { seriesName: 'Series', standings: [], matches: [] })
    }
  })
}
