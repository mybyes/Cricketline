import type { FastifyReply } from 'fastify'
import type { Redis } from 'ioredis'
import { staleResponse } from '../services/cache'

export async function sendOrStale<T>(
  redis: Redis,
  key: string,
  err: unknown,
  reply: FastifyReply,
): Promise<{ success: true; data: T; stale: true; error: string } | undefined> {
  const hit = await staleResponse<T>(redis, key, err)
  if (hit) return hit
  reply.status(500).send({ success: false, error: err instanceof Error ? err.message : 'Server error' })
}
