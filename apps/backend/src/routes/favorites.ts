import { FastifyInstance } from 'fastify'
import { addFavorite, listFavorites, removeFavorite } from '../services/store'

export default async function favoritesRoute(app: FastifyInstance) {
  app.get<{ Querystring: { device_id: string } }>('/favorites', async (req, reply) => {
    const { device_id } = req.query
    if (!device_id) return reply.status(400).send({ success: false, error: 'device_id required' })
    try {
      const data = await listFavorites(device_id)
      return { success: true, data }
    } catch (e: any) {
      reply.status(500).send({ success: false, error: e.message })
    }
  })

  app.post<{
    Body: { device_id: string; match_id: string; match_name: string; match_data?: Record<string, unknown> }
  }>('/favorites', async (req, reply) => {
    const { device_id, match_id, match_name, match_data } = req.body ?? {}
    if (!device_id || !match_id || !match_name) {
      return reply.status(400).send({ success: false, error: 'device_id, match_id, match_name required' })
    }
    try {
      await addFavorite(device_id, match_id, match_name, match_data ?? {})
      return { success: true }
    } catch (e: any) {
      reply.status(500).send({ success: false, error: e.message })
    }
  })

  app.delete<{ Params: { matchId: string }; Querystring: { device_id: string } }>(
    '/favorites/:matchId',
    async (req, reply) => {
      const { device_id } = req.query
      const { matchId } = req.params
      if (!device_id) return reply.status(400).send({ success: false, error: 'device_id required' })
      try {
        await removeFavorite(device_id, matchId)
        return { success: true }
      } catch (e: any) {
        reply.status(500).send({ success: false, error: e.message })
      }
    }
  )
}
