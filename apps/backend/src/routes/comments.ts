import { FastifyInstance } from 'fastify'
import { validateIdParam, isValidId } from '../lib/validateId'
import {
  addComment, listComments, flagComment,
  isValidDeviceId, CommentError, COMMENTS_ENABLED,
} from '../services/comments'

export default async function commentsRoute(app: FastifyInstance) {
  // Feature toggle — when disabled, the whole feature 503s (and the UI hides it).
  if (!COMMENTS_ENABLED) {
    app.get('/match/:id/comments', async (_req, reply) =>
      reply.status(503).send({ success: false, error: 'Comments are disabled' }))
    return
  }

  app.get<{ Params: { id: string }; Querystring: { limit?: string; offset?: string } }>(
    '/match/:id/comments',
    { preHandler: validateIdParam },
    async (req, reply) => {
      const limit = Math.min(Math.max(Number(req.query.limit) || 50, 1), 100)
      const offset = Math.max(Number(req.query.offset) || 0, 0)
      try {
        const data = await listComments(req.params.id, limit, offset)
        return { success: true, data }
      } catch (e) {
        req.log.error({ err: e }, 'list comments error')
        return reply.status(500).send({ success: false, error: 'Service unavailable' })
      }
    },
  )

  app.post<{ Params: { id: string }; Body: { device_id?: string; text?: string } }>(
    '/match/:id/comments',
    { preHandler: validateIdParam },
    async (req, reply) => {
      const { device_id, text } = req.body ?? {}
      if (!isValidDeviceId(device_id)) {
        return reply.status(400).send({ success: false, error: 'Valid device_id required' })
      }
      try {
        const comment = await addComment(req.params.id, device_id, text ?? '')
        return { success: true, data: comment }
      } catch (e) {
        if (e instanceof CommentError) {
          return reply.status(e.status).send({ success: false, error: e.message })
        }
        req.log.error({ err: e }, 'add comment error')
        return reply.status(500).send({ success: false, error: 'Service unavailable' })
      }
    },
  )

  app.post<{ Params: { id: string }; Body: { device_id?: string } }>(
    '/comments/:id/flag',
    async (req, reply) => {
      const { id } = req.params
      const { device_id } = req.body ?? {}
      if (!isValidId(id)) return reply.status(400).send({ success: false, error: 'Invalid comment id' })
      if (!isValidDeviceId(device_id)) {
        return reply.status(400).send({ success: false, error: 'Valid device_id required' })
      }
      try {
        const result = await flagComment(id, device_id)
        return { success: true, data: result }
      } catch (e) {
        if (e instanceof CommentError) {
          return reply.status(e.status).send({ success: false, error: e.message })
        }
        req.log.error({ err: e }, 'flag comment error')
        return reply.status(500).send({ success: false, error: 'Service unavailable' })
      }
    },
  )
}
