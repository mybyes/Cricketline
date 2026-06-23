import { FastifyInstance } from 'fastify'
import { validateIdParam } from '../lib/validateId'
import { isValidDeviceId } from '../services/comments'
import { getPoll, vote } from '../services/poll'

export default async function pollRoute(app: FastifyInstance) {
  app.get<{ Params: { id: string }; Querystring: { device_id?: string } }>(
    '/match/:id/poll',
    { preHandler: validateIdParam },
    async (req, reply) => {
      try {
        const result = await getPoll(req.params.id, req.query.device_id)
        return { success: true, data: result }
      } catch (e) {
        req.log.error({ err: e }, 'get poll error')
        return reply.status(500).send({ success: false, error: 'Service unavailable' })
      }
    },
  )

  app.post<{ Params: { id: string }; Body: { device_id?: string; choice?: number } }>(
    '/match/:id/poll',
    { preHandler: validateIdParam },
    async (req, reply) => {
      const { device_id, choice } = req.body ?? {}
      if (!isValidDeviceId(device_id)) {
        return reply.status(400).send({ success: false, error: 'Valid device_id required' })
      }
      if (choice !== 0 && choice !== 1) {
        return reply.status(400).send({ success: false, error: 'choice must be 0 or 1' })
      }
      try {
        const result = await vote(req.params.id, device_id, choice)
        return { success: true, data: result }
      } catch (e) {
        req.log.error({ err: e }, 'vote error')
        return reply.status(500).send({ success: false, error: 'Service unavailable' })
      }
    },
  )
}
