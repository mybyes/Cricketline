import postgres from 'postgres'

const DATABASE_URL = process.env.DATABASE_URL

let sql: ReturnType<typeof postgres> | null = null

export function getDb() {
  return sql
}

export async function initDb() {
  if (!DATABASE_URL || DATABASE_URL.includes('your_database_url_here')) return false

  sql = postgres(DATABASE_URL, { max: 5 })

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
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `
  return true
}
