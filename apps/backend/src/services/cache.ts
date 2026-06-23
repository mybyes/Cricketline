import { Redis } from 'ioredis'
import type { Match } from './cricapi'

const LIVE_MATCHES_TTL = 15
const SCORECARD_TTL    = 12
const SCHEDULE_TTL     = 600
const RECENT_TTL       = 600
const BACKUP_TTL       = 604_800 // 7d — outlive CricAPI cooldowns
const SQUAD_TTL        = 600
const BBB_TTL          = 12
const HISTORY_TTL      = 300
const SERIES_LIST_TTL  = 600
const SERIES_TABLE_TTL = 300
const ALL_MATCHES_TTL  = 300
const UPSTREAM_BACKOFF_KEY = 'meta:cricapi:backoff'
const UPSTREAM_BACKOFF_SEC = 900 // match CricAPI 15-min cooldown

type CacheBlob<T> = { v: T; at: number }

function wrap<T>(data: T): string {
  return JSON.stringify({ v: data, at: Date.now() } satisfies CacheBlob<T>)
}

function parseEntry<T>(raw: string): { data: T; cachedAt: number } {
  const parsed = JSON.parse(raw) as CacheBlob<T> | T
  if (parsed && typeof parsed === 'object' && 'v' in parsed && 'at' in parsed) {
    return { data: (parsed as CacheBlob<T>).v, cachedAt: (parsed as CacheBlob<T>).at }
  }
  return { data: parsed as T, cachedAt: Date.now() }
}

/** Never treat empty arrays/objects as worth storing over existing backup */
function isNonempty(data: unknown): boolean {
  if (data == null) return false
  if (Array.isArray(data)) return data.length > 0
  if (typeof data === 'object') return Object.keys(data as object).length > 0
  return true
}

async function readBackup<T>(redis: Redis, key: string): Promise<{ data: T; cachedAt: number } | null> {
  const raw = await redis.get(`${key}:backup`)
  if (!raw) return null
  const entry = parseEntry<T>(raw)
  return isNonempty(entry.data) ? entry : null
}

async function writeCache<T>(redis: Redis, key: string, ttl: number, data: T) {
  const blob = wrap(data)
  await redis.setex(key, ttl, blob)
  if (isNonempty(data)) {
    await redis.setex(`${key}:backup`, BACKUP_TTL, blob)
  }
}

export type CacheResult<T> = { data: T; stale: boolean; cachedAt: number }

/**
 * When true, `cached()` ignores Redis and always returns the fetcher result fresh.
 * Used in seed/demo mode so the built-in dataset is never shadowed by stale real data
 * left in Redis from a previous live run.
 */
let bypassCache = false
export function setCacheBypass(on: boolean) { bypassCache = on }

async function upstreamInBackoff(redis: Redis) {
  return !!(await redis.get(UPSTREAM_BACKOFF_KEY))
}

async function markUpstreamBackoff(redis: Redis) {
  await redis.setex(UPSTREAM_BACKOFF_KEY, UPSTREAM_BACKOFF_SEC, '1')
}

async function clearUpstreamBackoff(redis: Redis) {
  await redis.del(UPSTREAM_BACKOFF_KEY)
}

async function serveStaleOnly<T>(redis: Redis, key: string): Promise<CacheResult<T> | null> {
  const backup = await readBackup<T>(redis, key)
  if (backup) return { data: backup.data, stale: true, cachedAt: backup.cachedAt }
  const primary = await redis.get(key)
  if (primary) {
    const entry = parseEntry<T>(primary)
    if (isNonempty(entry.data)) {
      return { data: entry.data, stale: false, cachedAt: entry.cachedAt }
    }
  }
  return null
}

/** Read-through cache: primary → live fetch → backup (never wipes good data with empty) */
export async function cached<T>(
  redis: Redis,
  key: string,
  ttl: number,
  fetcher: () => Promise<T>,
): Promise<CacheResult<T>> {
  if (bypassCache) {
    return { data: await fetcher(), stale: false, cachedAt: Date.now() }
  }
  const primary = await redis.get(key)
  if (primary) {
    const entry = parseEntry<T>(primary)
    if (isNonempty(entry.data)) {
      return { data: entry.data, stale: false, cachedAt: entry.cachedAt }
    }
    const backup = await readBackup<T>(redis, key)
    if (backup) return { data: backup.data, stale: true, cachedAt: backup.cachedAt }
    return { data: entry.data, stale: false, cachedAt: entry.cachedAt }
  }

  if (await upstreamInBackoff(redis)) {
    const stale = await serveStaleOnly<T>(redis, key)
    if (stale) return stale
    throw new Error('upstream_unavailable')
  }

  try {
    const fresh = await fetcher()
    if (isNonempty(fresh)) await clearUpstreamBackoff(redis)
    await writeCache(redis, key, ttl, fresh)
    if (isNonempty(fresh)) {
      return { data: fresh, stale: false, cachedAt: Date.now() }
    }
    const backup = await readBackup<T>(redis, key)
    if (backup) return { data: backup.data, stale: true, cachedAt: backup.cachedAt }
    return { data: fresh, stale: false, cachedAt: Date.now() }
  } catch {
    await markUpstreamBackoff(redis)
    const backup = await readBackup<T>(redis, key)
    if (backup) return { data: backup.data, stale: true, cachedAt: backup.cachedAt }
    throw new Error('upstream_unavailable')
  }
}

export async function readCache<T>(redis: Redis, key: string): Promise<{ data: T; cachedAt: number } | null> {
  const raw = await redis.get(key) ?? await redis.get(`${key}:backup`)
  if (!raw) return null
  const entry = parseEntry<T>(raw)
  return isNonempty(entry.data) ? entry : null
}

export function filterLiveMatches(all: Match[]) {
  return all.filter((m) => m.matchStarted && !m.matchEnded)
}

export function filterUpcomingMatches(all: Match[]) {
  return all.filter((m) => !m.matchStarted && !m.matchEnded)
}

export function filterRecentMatches(all: Match[], limit = 15) {
  return all
    .filter((m) => m.matchEnded)
    .sort((a, b) => new Date(b.dateTimeGMT).getTime() - new Date(a.dateTimeGMT).getTime())
    .slice(0, limit)
}

/** Last resort: derive a tab from the master all-matches backup */
export async function resolveMatchListFallback(
  redis: Redis,
  key: string,
  derive: (all: Match[]) => Match[],
): Promise<{ data: Match[]; cachedAt: number } | null> {
  const hit = await readCache<Match[]>(redis, key)
  if (hit) return hit

  const all = await readCache<Match[]>(redis, CACHE_KEYS.allMatches())
  if (!all) return null
  const derived = derive(all.data)
  if (!derived.length) return null
  return { data: derived, cachedAt: all.cachedAt }
}

export function apiPayload<T>(result: CacheResult<T>) {
  return {
    success: true as const,
    data: result.data,
    stale: result.stale,
    ...(result.stale ? { cachedAt: result.cachedAt } : {}),
  }
}

export async function apiPayloadOrCache<T>(
  redis: Redis,
  key: string,
  result: CacheResult<T> | null,
  empty: T,
  derive?: (all: Match[]) => Match[],
) {
  if (result) return apiPayload(result)

  if (derive) {
    const hit = await resolveMatchListFallback(redis, key, derive)
    if (hit) {
      return { success: true as const, data: hit.data as T, stale: true, cachedAt: hit.cachedAt }
    }
  }

  const hit = await readCache<T>(redis, key)
  if (hit) {
    return { success: true as const, data: hit.data, stale: true, cachedAt: hit.cachedAt }
  }
  return { success: true as const, data: empty, stale: true }
}

export const CACHE_KEYS = {
  liveMatches:  () => 'matches:live',
  recentMatches: () => 'matches:recent',
  scorecard:    (id: string) => `scorecard:${id}`,
  squad:        (id: string) => `squad:${id}`,
  bbb:          (id: string) => `bbb:${id}`,
  history:      (id: string) => `history:${id}`,
  schedule:     () => 'matches:schedule',
  allMatches:   () => 'matches:all',
  seriesList:   () => 'series:list',
  seriesTable:  (id: string) => `series:table:${id}`,
}

export {
  LIVE_MATCHES_TTL, SCORECARD_TTL, SCHEDULE_TTL, RECENT_TTL,
  SQUAD_TTL, BBB_TTL, HISTORY_TTL, SERIES_LIST_TTL, SERIES_TABLE_TTL, ALL_MATCHES_TTL,
}
