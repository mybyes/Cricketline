import { Redis } from 'ioredis'
import type { FastifyInstance } from 'fastify'

const LIVE_MATCHES_TTL = 10
const SCORECARD_TTL    = 8
const SCHEDULE_TTL     = 300
const RECENT_TTL       = 120
const SQUAD_TTL        = 600
const BBB_TTL          = 12
const HISTORY_TTL      = 300
const SERIES_LIST_TTL  = 600
const SERIES_TABLE_TTL = 300

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
  liveMatches:  () => 'matches:live',
  recentMatches: () => 'matches:recent',
  scorecard:    (id: string) => `scorecard:${id}`,
  squad:        (id: string) => `squad:${id}`,
  bbb:          (id: string) => `bbb:${id}`,
  history:      (id: string) => `history:${id}`,
  schedule:     () => 'matches:schedule',
  seriesList:   () => 'series:list',
  seriesTable:  (id: string) => `series:table:${id}`,
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

export {
  LIVE_MATCHES_TTL, SCORECARD_TTL, SCHEDULE_TTL, RECENT_TTL,
  SQUAD_TTL, BBB_TTL, HISTORY_TTL, SERIES_LIST_TTL, SERIES_TABLE_TTL,
}
