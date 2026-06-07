import type { FastifyReply } from 'fastify'
import type { Redis } from 'ioredis'
import { staleResponse } from '../services/cache'

export async function sendOrStale<T>(
  redis: Redis,
  key: string,
  err: unknown,
  reply: FastifyReply,
  emptyFallback?: T,
): Promise<{ success: true; data: T; stale: true; error: string } | undefined> {
  const hit = await staleResponse<T>(redis, key, err)
  if (hit) return hit
  if (emptyFallback !== undefined) {
    const msg = err instanceof Error ? err.message : 'Server error'
    return { success: true, data: emptyFallback, stale: true, error: msg }
  }
  reply.status(500).send({ success: false, error: err instanceof Error ? err.message : 'Server error' })
}
