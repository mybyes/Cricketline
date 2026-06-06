import { Redis } from 'ioredis'
import type { FastifyInstance } from 'fastify'

const LIVE_MATCHES_TTL = 10      // 10 seconds — live scores
const SCORECARD_TTL    = 8       // 8 seconds
const SCHEDULE_TTL     = 300     // 5 mins — upcoming matches

export async function cached<T>(
  redis: Redis,
  key: string,
  ttl: number,
  fetcher: () => Promise<T>
): Promise<T> {
  const hit = await redis.get(key)
  if (hit) return JSON.parse(hit) as T

  const fresh = await fetcher()
  await redis.setex(key, ttl, JSON.stringify(fresh))
  return fresh
}

export const CACHE_KEYS = {
  liveMatches: () => 'matches:live',
  scorecard:   (id: string) => `scorecard:${id}`,
  schedule:    () => 'matches:schedule',
}

export async function withStaleFallback<T>(
  redis: FastifyInstance['redis'],
  key: string,
  fetch: () => Promise<T>
): Promise<{ data: T; stale?: boolean }> {
  try {
    const data = await fetch()
    return { data }
  } catch (e) {
    const hit = await redis.get(key)
    if (hit) return { data: JSON.parse(hit) as T, stale: true }
    throw e
  }
}

export { LIVE_MATCHES_TTL, SCORECARD_TTL, SCHEDULE_TTL }
