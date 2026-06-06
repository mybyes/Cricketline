import { FastifyInstance } from 'fastify'
import { savePushToken } from '../services/store'

export default async function devicesRoute(app: FastifyInstance) {
  app.post<{
    Body: { device_id: string; push_token: string; platform?: string }
  }>('/devices/register', async (req, reply) => {
    const { device_id, push_token, platform } = req.body ?? {}
    if (!device_id || !push_token) {
      return reply.status(400).send({ success: false, error: 'device_id and push_token required' })
    }
    try {
      await savePushToken(device_id, push_token, platform)
      return { success: true }
    } catch (e: any) {
      reply.status(500).send({ success: false, error: e.message })
    }
  })
}
