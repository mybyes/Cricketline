import { FastifyInstance } from 'fastify'
import { savePushToken } from '../services/store'
import { userFromRequest } from '../lib/auth'

export default async function devicesRoute(app: FastifyInstance) {
  app.post<{
    Body: { device_id: string; push_token: string; platform?: string; notify_enabled?: boolean }
  }>('/devices/register', async (req, reply) => {
    const { device_id, push_token, platform, notify_enabled } = req.body ?? {}
    if (!device_id || !push_token) {
      return reply.status(400).send({ success: false, error: 'device_id and push_token required' })
    }
    try {
      // Associate the token with the signed-in account when present, so match
      // notifications can be a per-user opt-in.
      const user = await userFromRequest(req)
      await savePushToken(device_id, push_token, platform, {
        userId: user?.id ?? null,
        notifyEnabled: notify_enabled ?? true,
      })
      return { success: true }
    } catch (e) {
      req.log.error({ err: e }, 'device register error')
      reply.status(500).send({ success: false, error: 'Service unavailable' })
    }
  })
}
