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

export async function savePushToken(deviceId: string, pushToken: string, platform?: string) {
  const db = getDb()
  if (db) {
    await db`
      INSERT INTO device_tokens (device_id, push_token, platform)
      VALUES (${deviceId}, ${pushToken}, ${platform ?? null})
      ON CONFLICT (device_id) DO UPDATE
      SET push_token = EXCLUDED.push_token, platform = EXCLUDED.platform, updated_at = NOW()
    `
    return
  }
  await savePushTokenRedis(deviceId, pushToken, platform)
}

// Redis fallback when DATABASE_URL is not set
const favKey = (id: string) => `favorites:${id}`
const tokenKey = (id: string) => `device:${id}`

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
}

async function removeFavoriteRedis(deviceId: string, matchId: string) {
  const redis = getRedis()
  const list = await listFavoritesRedis(deviceId)
  await redis.set(favKey(deviceId), JSON.stringify(list.filter((f) => f.match_id !== matchId)))
}

async function savePushTokenRedis(deviceId: string, pushToken: string, platform?: string) {
  const redis = getRedis()
  await redis.set(tokenKey(deviceId), JSON.stringify({ push_token: pushToken, platform }))
}

let _redis: Redis | null = null
function getRedis() {
  if (!_redis) throw new Error('Redis not initialized for store fallback')
  return _redis
}

export function initStoreRedis(redis: Redis) {
  _redis = redis
}
