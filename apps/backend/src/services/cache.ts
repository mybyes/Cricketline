import { Redis } from 'ioredis'
import type { FastifyInstance } from 'fastify'

const LIVE_MATCHES_TTL = 30
const SCORECARD_TTL    = 12
const SCHEDULE_TTL     = 600
const RECENT_TTL       = 600
const BACKUP_TTL       = 21_600 // 6h — survive CricAPI rate limits
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
  const json = JSON.stringify(fresh)
  await redis.setex(key, ttl, json)
  await redis.setex(`${key}:backup`, BACKUP_TTL, json)
  return fresh
}

async function readCache<T>(redis: Redis, key: string): Promise<T | null> {
  const hit = await redis.get(key) ?? await redis.get(`${key}:backup`)
  return hit ? (JSON.parse(hit) as T) : null
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
    const hit = await readCache<T>(redis, key)
    if (hit) return { data: hit, stale: true }
    throw e
  }
}

export {
  LIVE_MATCHES_TTL, SCORECARD_TTL, SCHEDULE_TTL, RECENT_TTL,
  SQUAD_TTL, BBB_TTL, HISTORY_TTL, SERIES_LIST_TTL, SERIES_TABLE_TTL,
}
