import { randomUUID } from 'node:crypto'
import { Redis } from 'ioredis'
import { getDb } from '../db'

export interface MatchComment {
  id: string
  match_id: string
  device_id: string
  text: string
  created_at: string
  flags: number
  hidden: boolean
}

export const COMMENTS_ENABLED =
  (process.env.COMMENTS_ENABLED ?? '1') !== '0' && (process.env.COMMENTS_ENABLED ?? 'true') !== 'false'

const MAX_LEN = 500
const MIN_LEN = 2
const FLAG_HIDE_THRESHOLD = 5
const PER_MATCH_LIMIT = 5 // comments per device per match
const COOLDOWN_SEC = 10 // min seconds between comments per device

// Tiny built-in word filter — real deployments should swap in a maintained list/library.
const BANNED = ['fuck', 'shit', 'bitch', 'asshole', 'bastard', 'cunt']

let _redis: Redis | null = null
export function initCommentsRedis(redis: Redis) { _redis = redis }
function getRedis() {
  if (!_redis) throw new Error('Redis not initialized for comments')
  return _redis
}

export class CommentError extends Error {
  constructor(public status: number, message: string) { super(message) }
}

/** Sanitize + validate user text. Strips links, collapses whitespace, masks banned words. */
export function moderateText(raw: unknown): string {
  if (typeof raw !== 'string') throw new CommentError(400, 'text required')
  let text = raw
    .replace(/\bhttps?:\/\/\S+/gi, '[link removed]')
    .replace(/\bwww\.\S+/gi, '[link removed]')
    .replace(/\s+/g, ' ')
    .trim()
  if (text.length < MIN_LEN) throw new CommentError(400, 'Comment too short')
  if (text.length > MAX_LEN) text = text.slice(0, MAX_LEN)
  for (const w of BANNED) {
    text = text.replace(new RegExp(`\\b${w}\\b`, 'gi'), '*'.repeat(w.length))
  }
  return text
}

export function isValidDeviceId(id: unknown): id is string {
  return typeof id === 'string' && /^[a-zA-Z0-9_.:-]{6,128}$/.test(id)
}

/** Enforce per-device cooldown + per-match cap via Redis counters. Throws CommentError on breach. */
async function enforceRateLimit(deviceId: string, matchId: string) {
  const redis = getRedis()
  const cooldownKey = `crate:${deviceId}`
  const set = await redis.set(cooldownKey, '1', 'EX', COOLDOWN_SEC, 'NX')
  if (set === null) throw new CommentError(429, `Please wait a few seconds between comments`)

  const matchKey = `cmatch:${deviceId}:${matchId}`
  const count = await redis.incr(matchKey)
  if (count === 1) await redis.expire(matchKey, 86_400)
  if (count > PER_MATCH_LIMIT) throw new CommentError(429, `Comment limit reached for this match`)
}

export async function addComment(matchId: string, deviceId: string, rawText: string): Promise<MatchComment> {
  const text = moderateText(rawText)
  await enforceRateLimit(deviceId, matchId)

  const comment: MatchComment = {
    id: randomUUID(),
    match_id: matchId,
    device_id: deviceId,
    text,
    created_at: new Date().toISOString(),
    flags: 0,
    hidden: false,
  }

  const db = getDb()
  if (db) {
    await db`
      INSERT INTO match_comments (id, match_id, device_id, text)
      VALUES (${comment.id}, ${matchId}, ${deviceId}, ${text})
    `
  } else {
    await addCommentRedis(comment)
  }
  return comment
}

export async function listComments(matchId: string, limit = 50, offset = 0): Promise<MatchComment[]> {
  const db = getDb()
  if (db) {
    const rows = await db`
      SELECT id, match_id, device_id, text, created_at::text as created_at, flags, hidden
      FROM match_comments
      WHERE match_id = ${matchId} AND hidden = false
      ORDER BY created_at DESC
      LIMIT ${limit} OFFSET ${offset}
    `
    return rows as unknown as MatchComment[]
  }
  return listCommentsRedis(matchId, limit, offset)
}

export async function flagComment(commentId: string, _deviceId: string): Promise<{ flags: number; hidden: boolean }> {
  const db = getDb()
  if (db) {
    const rows = await db`
      UPDATE match_comments
      SET flags = flags + 1, hidden = (flags + 1 >= ${FLAG_HIDE_THRESHOLD})
      WHERE id = ${commentId}
      RETURNING flags, hidden
    `
    if (!rows.length) throw new CommentError(404, 'Comment not found')
    return rows[0] as unknown as { flags: number; hidden: boolean }
  }
  return flagCommentRedis(commentId)
}

// ---- Redis fallback (used when DATABASE_URL is unset) ----
const cKey = (matchId: string) => `comments:${matchId}`

async function readCommentsRedis(matchId: string): Promise<MatchComment[]> {
  const raw = await getRedis().get(cKey(matchId))
  return raw ? (JSON.parse(raw) as MatchComment[]) : []
}

async function addCommentRedis(c: MatchComment) {
  const list = await readCommentsRedis(c.match_id)
  list.unshift(c)
  // keep newest 500 per match
  await getRedis().set(cKey(c.match_id), JSON.stringify(list.slice(0, 500)))
}

async function listCommentsRedis(matchId: string, limit: number, offset: number): Promise<MatchComment[]> {
  const list = await readCommentsRedis(matchId)
  return list.filter((c) => !c.hidden).slice(offset, offset + limit)
}

async function flagCommentRedis(commentId: string): Promise<{ flags: number; hidden: boolean }> {
  const redis = getRedis()
  // comment id isn't indexed by match in Redis; scan match comment keys
  const keys = await redis.keys('comments:*')
  for (const key of keys) {
    const raw = await redis.get(key)
    if (!raw) continue
    const list = JSON.parse(raw) as MatchComment[]
    const c = list.find((x) => x.id === commentId)
    if (c) {
      c.flags += 1
      c.hidden = c.flags >= FLAG_HIDE_THRESHOLD
      await redis.set(key, JSON.stringify(list))
      return { flags: c.flags, hidden: c.hidden }
    }
  }
  throw new CommentError(404, 'Comment not found')
}
