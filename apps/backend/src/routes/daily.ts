import { FastifyInstance } from 'fastify'
import { getAllMatchesCached } from '../services/cricapi'
import { OFFERS, pickMatchOfTheDay } from '../services/daily'

export default async function dailyRoute(app: FastifyInstance) {
  app.get('/daily', async (req, reply) => {
    try {
      let matchOfTheDay = null
      try {
        const all = await getAllMatchesCached(app.redis)
        matchOfTheDay = pickMatchOfTheDay(all)
      } catch {
        matchOfTheDay = null // offers still useful even if match data is down
      }
      return { success: true, data: { matchOfTheDay, offers: OFFERS } }
    } catch (e) {
      req.log.error({ err: e }, 'daily error')
      return reply.status(500).send({ success: false, error: 'Service unavailable' })
    }
  })
}
