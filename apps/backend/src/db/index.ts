import postgres from 'postgres'

const DATABASE_URL = process.env.DATABASE_URL

let sql: ReturnType<typeof postgres> | null = null

export function getDb() {
  return sql
}

export async function initDb() {
  if (!DATABASE_URL || DATABASE_URL.includes('your_database_url_here')) return false

  try {
    sql = postgres(DATABASE_URL, { max: 20, idle_timeout: 20, connect_timeout: 10 })

    await sql`
      CREATE TABLE IF NOT EXISTS users (
        id TEXT PRIMARY KEY,
        google_sub TEXT UNIQUE NOT NULL,
        email TEXT,
        name TEXT,
        picture TEXT,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        last_login_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `

    await sql`
      CREATE TABLE IF NOT EXISTS favorites (
        device_id TEXT NOT NULL,
        match_id TEXT NOT NULL,
        match_name TEXT NOT NULL,
        match_data JSONB NOT NULL DEFAULT '{}',
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        PRIMARY KEY (device_id, match_id)
      )
    `
    await sql`
      CREATE TABLE IF NOT EXISTS device_tokens (
        device_id TEXT PRIMARY KEY,
        push_token TEXT NOT NULL,
        platform TEXT,
        user_id TEXT REFERENCES users (id) ON DELETE SET NULL,
        notify_enabled BOOLEAN NOT NULL DEFAULT TRUE,
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `
    // Additive migration for installs created before accounts existed.
    await sql`ALTER TABLE device_tokens ADD COLUMN IF NOT EXISTS user_id TEXT REFERENCES users (id) ON DELETE SET NULL`
    await sql`ALTER TABLE device_tokens ADD COLUMN IF NOT EXISTS notify_enabled BOOLEAN NOT NULL DEFAULT TRUE`
    await sql`
      CREATE TABLE IF NOT EXISTS match_comments (
        id TEXT PRIMARY KEY,
        match_id TEXT NOT NULL,
        device_id TEXT NOT NULL,
        text TEXT NOT NULL,
        flags INT NOT NULL DEFAULT 0,
        hidden BOOLEAN NOT NULL DEFAULT FALSE,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `
    await sql`CREATE INDEX IF NOT EXISTS idx_comments_match ON match_comments (match_id, created_at DESC)`
    return true
  } catch (e) {
    console.error('PostgreSQL unavailable — falling back to Redis:', e)
    sql = null
    return false
  }
}
