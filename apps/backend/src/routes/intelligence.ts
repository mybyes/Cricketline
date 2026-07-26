import { FastifyInstance } from 'fastify'
import { validateIdParam } from '../lib/validateId'
import { getMatchIntelligence } from '../cie/service'

export default async function intelligenceRoute(app: FastifyInstance) {
  app.get<{ Params: { id: string } }>(
    '/match/:id/intelligence',
    { preHandler: validateIdParam },
    async (req, reply) => {
      try {
        const intel = await getMatchIntelligence(app.redis, req.params.id)
        if (!intel) {
          return reply.status(404).send({ success: false, error: 'Intelligence unavailable for this match' })
        }
        return { success: true, data: intel }
      } catch (e) {
        req.log.warn({ err: e, matchId: req.params.id }, 'intelligence error')
        return reply.status(503).send({ success: false, error: 'Intelligence temporarily unavailable' })
      }
    },
  )
}
