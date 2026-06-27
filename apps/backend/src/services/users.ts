import { randomUUID } from 'crypto'
import { Redis } from 'ioredis'
import { getDb } from '../db'
import type { GoogleProfile, SessionUser } from '../lib/auth'

/**
 * User records, mirroring store.ts: Postgres when DATABASE_URL is set, Redis otherwise,
 * so accounts work the same in demo mode and in production.
 */

export async function upsertUserByGoogle(profile: GoogleProfile): Promise<SessionUser> {
  const db = getDb()
  if (db) {
    const id = randomUUID()
    const rows = await db`
      INSERT INTO users (id, google_sub, email, name, picture)
      VALUES (${id}, ${profile.sub}, ${profile.email ?? null}, ${profile.name ?? null}, ${profile.picture ?? null})
      ON CONFLICT (google_sub) DO UPDATE
      SET email = EXCLUDED.email, name = EXCLUDED.name, picture = EXCLUDED.picture, last_login_at = NOW()
      RETURNING id, email, name, picture
    `
    const u = rows[0] as { id: string; email?: string; name?: string; picture?: string }
    return { id: u.id, email: u.email ?? undefined, name: u.name ?? undefined, picture: u.picture ?? undefined }
  }
  return upsertUserRedis(profile)
}

export async function getUser(id: string): Promise<SessionUser | null> {
  const db = getDb()
  if (db) {
    const rows = await db`SELECT id, email, name, picture FROM users WHERE id = ${id}`
    if (!rows.length) return null
    const u = rows[0] as { id: string; email?: string; name?: string; picture?: string }
    return { id: u.id, email: u.email ?? undefined, name: u.name ?? undefined, picture: u.picture ?? undefined }
  }
  const raw = await getRedis().get(userKey(id))
  return raw ? (JSON.parse(raw) as SessionUser) : null
}

// ---- Redis fallback ----
const userKey = (id: string) => `user:${id}`
const subKey = (sub: string) => `user:bySub:${sub}`

async function upsertUserRedis(profile: GoogleProfile): Promise<SessionUser> {
  const redis = getRedis()
  const existingId = await redis.get(subKey(profile.sub))
  const id = existingId ?? randomUUID()
  const user: SessionUser = { id, email: profile.email, name: profile.name, picture: profile.picture }
  await redis.set(userKey(id), JSON.stringify(user))
  if (!existingId) await redis.set(subKey(profile.sub), id)
  return user
}

let _redis: Redis | null = null
function getRedis() {
  if (!_redis) throw new Error('Redis not initialized for users fallback')
  return _redis
}
export function initUsersRedis(redis: Redis) {
  _redis = redis
}
