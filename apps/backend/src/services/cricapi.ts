import axios from 'axios'
import type { Redis } from 'ioredis'
import { cached, CACHE_KEYS, ALL_MATCHES_TTL, setCacheBypass } from './cache'
import { SEED_MATCHES, SEED_SCORECARDS, SEED_BBB, SEED_SQUADS } from '../data/seed'
import { CRICBUZZ_ENABLED, fetchCricbuzzMatches } from './cricbuzzSource'

const BASE = 'https://api.cricapi.com/v1'

/**
 * Key pool. Supports a comma-separated CRICAPI_KEYS list (preferred) and falls
 * back to the legacy single CRICAPI_KEY. Each key has its own daily quota, so
 * rotating to the next key when one is exhausted multiplies the free-tier limit
 * and provides a fallback source without changing providers.
 */
const KEYS: string[] = [
  ...(process.env.CRICAPI_KEYS ?? '').split(','),
  process.env.CRICAPI_KEY ?? '',
]
  .map((k) => k.trim())
  .filter(Boolean)
  .filter((k, i, arr) => arr.indexOf(k) === i)

/**
 * Seed/demo mode — serve the built-in dataset instead of calling CricAPI. Active when
 * no key is configured (keyless build) or when SEED_DATA=1 forces it. Lets the whole app
 * run and demo without live data; flip to live by setting a CRICAPI_KEY and unsetting SEED_DATA.
 */
export const SEED_MODE =
  process.env.SEED_DATA === '1' || process.env.SEED_DATA === 'true' || KEYS.length === 0

// In seed mode, never let stale real data in Redis shadow the built-in dataset.
setCacheBypass(SEED_MODE)

/** In-memory map: key → epoch ms until which the key is treated as quota-exhausted. */
const exhaustedUntil = new Map<string, number>()

/** CricAPI quotas reset daily (UTC). Park an exhausted key until the next UTC midnight. */
function nextUtcReset(): number {
  const now = new Date()
  return Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() + 1, 0, 0, 0, 0)
}

type CricResponse = {
  status?: string
  reason?: string
  message?: string
  data?: unknown
  info?: { hitsToday?: number; hitsLimit?: number; credits?: number }
}

/** Daily-hit limit reached (or out of credits) — rotate to the next key rather than failing. */
function isQuotaError(data: CricResponse): boolean {
  const info = data.info
  if (info && typeof info.hitsLimit === 'number' && typeof info.hitsToday === 'number' && info.hitsToday >= info.hitsLimit) {
    return true
  }
  if (info && info.credits === 0) return true
  const reason = (data.reason ?? data.message ?? '').toLowerCase()
  return reason.includes('hits') || reason.includes('limit') || reason.includes('quota') || reason.includes('credit')
}

/**
 * Request the CricAPI, rotating through the key pool. A key that hits its daily
 * quota is parked until the next UTC reset; only when every key is exhausted (or
 * the network is down) does this throw — letting the cache layer serve stale data.
 */
async function cricGet<T>(path: string, params: Record<string, string | number> = {}): Promise<T> {
  if (KEYS.length === 0) throw new Error('CricAPI: no API key configured')

  const now = Date.now()
  const fresh = KEYS.filter((k) => (exhaustedUntil.get(k) ?? 0) <= now)
  // If all keys look exhausted, still retry the full set — the daily reset may have passed.
  const order = fresh.length > 0 ? fresh : KEYS

  let lastError: Error = new Error('CricAPI: all keys exhausted')
  for (const key of order) {
    try {
      const { data } = await axios.get<CricResponse>(`${BASE}/${path}`, {
        params: { apikey: key, ...params },
        timeout: 10_000,
      })
      if (data.status === 'success') {
        exhaustedUntil.delete(key)
        return data.data as T
      }
      if (isQuotaError(data)) {
        // Park this key until the daily reset, then try the next one.
        exhaustedUntil.set(key, nextUtcReset())
      }
      // Any non-success (quota, invalid key, bad id) — record and try the next key.
      // If it's a genuine per-request error (e.g. bad id) every key returns the
      // same thing and the last error is surfaced after the pool is exhausted.
      lastError = new Error(data.reason ?? data.message ?? 'CricAPI error')
    } catch (err) {
      // Network/timeout error: remember it and try the next key.
      lastError = err instanceof Error ? err : new Error(String(err))
    }
  }
  throw lastError
}

/** True when every configured key is currently parked as quota-exhausted. */
export function allKeysExhausted(): boolean {
  if (KEYS.length === 0) return true
  const now = Date.now()
  return KEYS.every((k) => (exhaustedUntil.get(k) ?? 0) > now)
}

async function fetchAllMatches() {
  if (SEED_MODE) return SEED_MATCHES
  try {
    const primary = await cricGet<Match[]>('matches', { offset: 0 })
    if (primary.length || !CRICBUZZ_ENABLED) return primary
  } catch (err) {
    if (!CRICBUZZ_ENABLED) throw err
  }
  // Primary empty or failed → fall back to the secondary source (Cricbuzz via RapidAPI).
  return fetchCricbuzzMatches()
}

export async function getAllMatchesCached(redis: Redis) {
  const { data } = await cached(redis, CACHE_KEYS.allMatches(), ALL_MATCHES_TTL, fetchAllMatches)
  return data
}

/**
 * Whether the key supports the richer `currentMatches` endpoint. Cached only on a
 * definitive answer — a quota-blocked probe returns `null` so we retry later rather
 * than permanently downgrading to the all-matches filter for the process lifetime.
 */
let useCurrentMatches: boolean | null = null

async function tryCurrentMatches(): Promise<Match[] | null> {
  try {
    return await cricGet<Match[]>('currentMatches', { offset: 0 })
  } catch {
    return null
  }
}

export async function getLiveMatches(redis: Redis) {
  if (SEED_MODE) {
    return SEED_MATCHES.filter((m) => m.matchStarted && !m.matchEnded)
  }
  if (useCurrentMatches !== false) {
    const current = await tryCurrentMatches()
    if (current && Array.isArray(current)) {
      useCurrentMatches = true
      return current
    }
    // Only downgrade permanently when the endpoint genuinely isn't on this key
    // (i.e. some key still had quota but the call failed). If everything is just
    // quota-exhausted, leave the flag unset so we re-probe after the daily reset.
    if (!allKeysExhausted()) useCurrentMatches = false
  }

  const all = await getAllMatchesCached(redis)
  return all.filter((m) => m.matchStarted && !m.matchEnded)
}

export async function getUpcomingMatches(redis: Redis) {
  const all = await getAllMatchesCached(redis)
  return all.filter((m) => !m.matchStarted && !m.matchEnded)
}

export async function getRecentMatches(redis: Redis, limit = 15) {
  const all = await getAllMatchesCached(redis)
  return all
    .filter((m) => m.matchEnded)
    .sort((a, b) => new Date(b.dateTimeGMT).getTime() - new Date(a.dateTimeGMT).getTime())
    .slice(0, limit)
}

/**
 * Pre-filled fallback set — the genuine last resort. Routes use this only after the live
 * source AND the cached real-data backup are both unavailable (no key / over quota / API
 * down with a cold cache), so the app is never blank. Real data — even stale — is always
 * preferred over this; seed never gets written back into the cache.
 */
export function seedMatchList(kind: 'live' | 'recent' | 'upcoming'): Match[] {
  if (kind === 'live') return SEED_MATCHES.filter((m) => m.matchStarted && !m.matchEnded)
  if (kind === 'upcoming') return SEED_MATCHES.filter((m) => !m.matchStarted && !m.matchEnded)
  return SEED_MATCHES.filter((m) => m.matchEnded)
    .sort((a, b) => new Date(b.dateTimeGMT).getTime() - new Date(a.dateTimeGMT).getTime())
    .slice(0, 15)
}

export function seedSeriesList(limit = 12) {
  return [
    { id: 'seed-series', name: 'Indian Premier League 2026', startDate: '2026-05-01', endDate: '2026-06-30', odi: 0, t20: 1, test: 0 },
    { id: 'seed-series-2', name: 'England tour of India 2026', startDate: '2026-06-10', endDate: '2026-07-05', odi: 0, t20: 0, test: 1 },
  ].slice(0, limit)
}

export async function getMatchScore(matchId: string) {
  if (SEED_MODE) {
    const sc = SEED_SCORECARDS[matchId]
    if (sc) return sc
    const m = SEED_MATCHES.find((x) => x.id === matchId)
    if (m) return scorecardFromMatch(m)
    throw new Error('seed: scorecard not found')
  }
  return cricGet('match_scorecard', { id: matchId })
}

export async function getMatchSquad(matchId: string) {
  if (SEED_MODE) return SEED_SQUADS[matchId] ?? []
  return cricGet('match_squad', { id: matchId })
}

export async function getMatchBbb(matchId: string) {
  if (SEED_MODE) return SEED_BBB[matchId] ?? []
  return cricGet<{ ballNbr: number; overNum: number; innings: number; event: string; runs: number; batsman: string; bowler: string }[]>(
    'match_bbb',
    { id: matchId },
  )
}

/** Minimal scorecard from a cached match row — keeps scores visible when scorecard API is down */
export function scorecardFromMatch(m: Match) {
  return {
    id: m.id,
    name: m.name,
    matchType: m.matchType ?? 'match',
    status: m.status,
    venue: m.venue,
    date: m.date,
    teams: m.teams,
    teamInfo: m.teamInfo ?? [],
    score: m.score ?? [],
    scorecard: [] as { inning: string; batting: unknown[]; bowling: unknown[] }[],
    matchStarted: m.matchStarted,
    matchEnded: m.matchEnded,
  }
}

export async function getMatchHistory(matchId: string, redis: Redis) {
  const all = await getAllMatchesCached(redis)
  return buildMatchHistory(matchId, all)
}

export function buildMatchHistory(matchId: string, all: Match[]) {
  const match = all.find((m) => m.id === matchId)
  if (!match) return { headToHead: [], team1Recent: [], team2Recent: [] }

  const t0 = match.teams[0]?.toLowerCase() ?? ''
  const t1 = match.teams[1]?.toLowerCase() ?? ''
  const sharesTeam = (m: Match, team: string) =>
    m.teams.some((t) => t.toLowerCase().includes(team) || team.includes(t.toLowerCase()))

  const ended = all.filter((m) => m.matchEnded && m.id !== matchId)

  const headToHead = ended
    .filter((m) => sharesTeam(m, t0) && sharesTeam(m, t1))
    .sort((a, b) => new Date(b.dateTimeGMT).getTime() - new Date(a.dateTimeGMT).getTime())
    .slice(0, 8)

  const team1Recent = ended
    .filter((m) => sharesTeam(m, t0) && !sharesTeam(m, t1))
    .sort((a, b) => new Date(b.dateTimeGMT).getTime() - new Date(a.dateTimeGMT).getTime())
    .slice(0, 5)

  const team2Recent = ended
    .filter((m) => sharesTeam(m, t1) && !sharesTeam(m, t0))
    .sort((a, b) => new Date(b.dateTimeGMT).getTime() - new Date(a.dateTimeGMT).getTime())
    .slice(0, 5)

  return { headToHead, team1Recent, team2Recent, teams: match.teams }
}

export async function getSeriesList(limit = 12) {
  if (SEED_MODE) return seedSeriesList(limit)
  const data = await cricGet<{ id: string; name: string; startDate: string; endDate: string; odi: number; t20: number; test: number }[]>(
    'series',
    { offset: 0 },
  )
  return data.slice(0, limit)
}

export async function getSeriesTable(seriesId: string) {
  if (SEED_MODE) {
    const ended = SEED_MATCHES.filter((m) => m.matchEnded)
    const runs = new Map<string, { name: string; runs: number; balls: number }>()
    const wkts = new Map<string, { name: string; wkts: number; runs: number }>()
    for (const sc of Object.values(SEED_SCORECARDS)) {
      for (const inn of sc.scorecard) {
        for (const b of inn.batting) {
          const r = runs.get(b.batsman.name) ?? { name: b.batsman.name, runs: 0, balls: 0 }
          r.runs += b.r; r.balls += b.b; runs.set(b.batsman.name, r)
        }
        for (const bw of inn.bowling) {
          const w = wkts.get(bw.bowler.name) ?? { name: bw.bowler.name, wkts: 0, runs: 0 }
          w.wkts += bw.w; w.runs += bw.r; wkts.set(bw.bowler.name, w)
        }
      }
    }
    return {
      seriesName: 'IPL 2026',
      standings: buildStandingsFromMatches(ended),
      matches: SEED_MATCHES,
      topRuns: [...runs.values()].sort((a, b) => b.runs - a.runs).slice(0, 5),
      topWickets: [...wkts.values()].sort((a, b) => b.wkts - a.wkts || a.runs - b.runs).slice(0, 5),
    }
  }
  try {
    const info = await cricGet<{
      info: { name: string; startdate: string; enddate: string }
      matchList: { id: string; name: string; status: string; matchEnded: boolean; teams: string[]; score?: Score[] }[]
    }>('series_info', { id: seriesId })

    const standings = buildStandingsFromMatches(info.matchList ?? [])
    return {
      seriesName: info.info?.name ?? 'Series',
      standings,
      matches: (info.matchList ?? []).slice(0, 20),
    }
  } catch {
    return { seriesName: 'Series', standings: [], matches: [] }
  }
}

function teamMentioned(team: string, text: string): boolean {
  const t = text.toLowerCase()
  const full = team.toLowerCase()
  const short = full.split(' ')[0]
  return t.includes(full) || (short.length >= 3 && t.includes(short))
}

function scoreForTeam(team: string, scores: Score[]) {
  const key = team.toLowerCase().split(' ')[0]
  return scores.find((s) => s.inning.toLowerCase().includes(key))
}

function detectWinner(m: { teams: string[]; status: string; score?: Score[] }): string | null {
  const [a, b] = m.teams
  const status = m.status.toLowerCase()

  if (teamMentioned(a, status)) return a
  if (teamMentioned(b, status)) return b

  const wonBy = m.status.match(/^(.+?)\s+won\s+by/i)
  if (wonBy) {
    const fragment = wonBy[1]
    if (teamMentioned(a, fragment)) return a
    if (teamMentioned(b, fragment)) return b
  }

  const scores = m.score ?? []
  if (scores.length < 2) return null
  const sa = scoreForTeam(a, scores)
  const sb = scoreForTeam(b, scores)
  if (!sa || !sb) return null

  if (status.includes('wicket')) {
    const last = scores[scores.length - 1]
    if (teamMentioned(a, last.inning)) return a
    if (teamMentioned(b, last.inning)) return b
  }

  if (status.includes('run')) {
    if (sa.r > sb.r) return a
    if (sb.r > sa.r) return b
  }

  if (sa.r !== sb.r) return sa.r > sb.r ? a : b
  return null
}

function buildStandingsFromMatches(matches: { teams: string[]; status: string; matchEnded: boolean; score?: Score[] }[]) {
  const table = new Map<string, { team: string; m: number; w: number; l: number; t: number; nr: number; pts: number }>()

  const ensure = (team: string) => {
    if (!table.has(team)) table.set(team, { team, m: 0, w: 0, l: 0, t: 0, nr: 0, pts: 0 })
    return table.get(team)!
  }

  for (const m of matches) {
    if (!m.matchEnded || m.teams.length < 2) continue
    const [a, b] = m.teams
    const rowA = ensure(a)
    const rowB = ensure(b)
    rowA.m++
    rowB.m++

    const status = m.status.toLowerCase()
    if (status.includes('no result') || status.includes('abandoned') || status.includes('cancelled')) {
      rowA.nr++
      rowB.nr++
      rowA.pts += 1
      rowB.pts += 1
    } else if (status.includes('tie') || status.includes('draw') || status.includes('tied')) {
      rowA.t++
      rowB.t++
      rowA.pts += 1
      rowB.pts += 1
    } else {
      const winner = detectWinner(m)
      if (winner === a) {
        rowA.w++
        rowB.l++
        rowA.pts += 2
      } else if (winner === b) {
        rowB.w++
        rowA.l++
        rowB.pts += 2
      }
    }
  }

  return [...table.values()].sort((x, y) => y.pts - x.pts || y.w - x.w)
}

export interface Match {
  id: string
  name: string
  matchType?: string
  status: string
  venue: string
  date: string
  dateTimeGMT: string
  teams: string[]
  teamInfo: TeamInfo[]
  score: Score[]
  series_id: string
  fantasyEnabled: boolean
  bbbEnabled: boolean
  hasSquad: boolean
  matchStarted: boolean
  matchEnded: boolean
}

interface TeamInfo {
  name: string
  shortname: string
  img: string
}

interface Score {
  r: number
  w: number
  o: number
  inning: string
}
