import { Redis } from 'ioredis'
import { getDb } from '../db'

export interface FavoriteRecord {
  match_id: string
  match_name: string
  match_data: Record<string, unknown>
  created_at?: string
}

export async function listFavorites(deviceId: string): Promise<FavoriteRecord[]> {
  const db = getDb()
  if (db) {
    const rows = await db`
      SELECT match_id, match_name, match_data, created_at::text as created_at
      FROM favorites WHERE device_id = ${deviceId}
      ORDER BY created_at DESC
    `
    return rows as unknown as FavoriteRecord[]
  }
  return listFavoritesRedis(deviceId)
}

export async function addFavorite(
  deviceId: string,
  matchId: string,
  matchName: string,
  matchData: Record<string, unknown>
) {
  const db = getDb()
  if (db) {
    await db`
      INSERT INTO favorites (device_id, match_id, match_name, match_data)
      VALUES (${deviceId}, ${matchId}, ${matchName}, ${db.json(matchData as Record<string, never>)})
      ON CONFLICT (device_id, match_id) DO UPDATE
      SET match_name = EXCLUDED.match_name, match_data = EXCLUDED.match_data
    `
    return
  }
  await addFavoriteRedis(deviceId, { match_id: matchId, match_name: matchName, match_data: matchData })
}

export async function removeFavorite(deviceId: string, matchId: string) {
  const db = getDb()
  if (db) {
    await db`DELETE FROM favorites WHERE device_id = ${deviceId} AND match_id = ${matchId}`
    return
  }
  await removeFavoriteRedis(deviceId, matchId)
}

export interface PushTokenOpts {
  userId?: string | null
  notifyEnabled?: boolean
}

export async function savePushToken(deviceId: string, pushToken: string, platform?: string, opts: PushTokenOpts = {}) {
  const userId = opts.userId ?? null
  const notifyEnabled = opts.notifyEnabled ?? true
  const db = getDb()
  if (db) {
    await db`
      INSERT INTO device_tokens (device_id, push_token, platform, user_id, notify_enabled)
      VALUES (${deviceId}, ${pushToken}, ${platform ?? null}, ${userId}, ${notifyEnabled})
      ON CONFLICT (device_id) DO UPDATE
      SET push_token = EXCLUDED.push_token, platform = EXCLUDED.platform,
          user_id = EXCLUDED.user_id, notify_enabled = EXCLUDED.notify_enabled, updated_at = NOW()
    `
    return
  }
  await savePushTokenRedis(deviceId, pushToken, platform, userId, notifyEnabled)
}

export async function getPushTokensForMatch(matchId: string): Promise<string[]> {
  const db = getDb()
  if (db) {
    const rows = await db`
      SELECT DISTINCT d.push_token
      FROM favorites f
      INNER JOIN device_tokens d ON f.device_id = d.device_id
      WHERE f.match_id = ${matchId} AND d.notify_enabled = TRUE
    `
    return rows.map((r) => r.push_token as string)
  }
  return getPushTokensForMatchRedis(matchId)
}

// Redis fallback when DATABASE_URL is not set
const favKey = (id: string) => `favorites:${id}`
const tokenKey = (id: string) => `device:${id}`
const fanKey = (matchId: string) => `matchFans:${matchId}`

async function listFavoritesRedis(deviceId: string): Promise<FavoriteRecord[]> {
  const redis = getRedis()
  const raw = await redis.get(favKey(deviceId))
  if (!raw) return []
  return JSON.parse(raw) as FavoriteRecord[]
}

async function addFavoriteRedis(deviceId: string, fav: FavoriteRecord) {
  const redis = getRedis()
  const list = await listFavoritesRedis(deviceId)
  const next = [fav, ...list.filter((f) => f.match_id !== fav.match_id)]
  await redis.set(favKey(deviceId), JSON.stringify(next))
  await redis.sadd(fanKey(fav.match_id), deviceId)
}

async function removeFavoriteRedis(deviceId: string, matchId: string) {
  const redis = getRedis()
  const list = await listFavoritesRedis(deviceId)
  const had = list.some((f) => f.match_id === matchId)
  await redis.set(favKey(deviceId), JSON.stringify(list.filter((f) => f.match_id !== matchId)))
  if (had) await redis.srem(fanKey(matchId), deviceId)
}

async function getPushTokensForMatchRedis(matchId: string): Promise<string[]> {
  const redis = getRedis()
  const deviceIds = await redis.smembers(fanKey(matchId))
  const tokens: string[] = []
  for (const id of deviceIds) {
    const raw = await redis.get(tokenKey(id))
    if (!raw) continue
    const parsed = JSON.parse(raw) as { push_token?: string; notify_enabled?: boolean }
    if (parsed.push_token && parsed.notify_enabled !== false) tokens.push(parsed.push_token)
  }
  return tokens
}

async function savePushTokenRedis(
  deviceId: string, pushToken: string, platform?: string, userId?: string | null, notifyEnabled = true,
) {
  const redis = getRedis()
  await redis.set(tokenKey(deviceId), JSON.stringify({ push_token: pushToken, platform, user_id: userId ?? null, notify_enabled: notifyEnabled }))
}

let _redis: Redis | null = null
function getRedis() {
  if (!_redis) throw new Error('Redis not initialized for store fallback')
  return _redis
}

export function initStoreRedis(redis: Redis) {
  _redis = redis
}

/** Rebuild matchFans index from existing Redis favorites (no-op when using Postgres). */
export async function rebuildMatchFanIndex() {
  if (getDb()) return
  const redis = getRedis()
  const keys = await redis.keys('favorites:*')
  for (const key of keys) {
    const deviceId = key.slice('favorites:'.length)
    const raw = await redis.get(key)
    if (!raw) continue
    const list = JSON.parse(raw) as FavoriteRecord[]
    for (const fav of list) {
      await redis.sadd(fanKey(fav.match_id), deviceId)
    }
  }
}
