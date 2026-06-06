import { FastifyInstance } from 'fastify'
import { getSeriesList, getSeriesTable } from '../services/cricapi'
import { CACHE_KEYS, SERIES_LIST_TTL, SERIES_TABLE_TTL, cached, withStaleFallback } from '../services/cache'

export default async function seriesRoute(app: FastifyInstance) {
  app.get('/series', async (req, reply) => {
    const key = CACHE_KEYS.seriesList()
    try {
      const { data, stale } = await withStaleFallback(app.redis, key, () =>
        cached(app.redis, key, SERIES_LIST_TTL, () => getSeriesList())
      )
      return { success: true, data, stale: stale ?? false }
    } catch (e: any) {
      reply.status(500).send({ success: false, error: e.message })
    }
  })

  app.get<{ Params: { id: string } }>('/series/:id/table', async (req, reply) => {
    const { id } = req.params
    const key = CACHE_KEYS.seriesTable(id)
    try {
      const { data, stale } = await withStaleFallback(app.redis, key, () =>
        cached(app.redis, key, SERIES_TABLE_TTL, () => getSeriesTable(id))
      )
      return { success: true, data, stale: stale ?? false }
    } catch (e: any) {
      reply.status(500).send({ success: false, error: e.message })
    }
  })
}
