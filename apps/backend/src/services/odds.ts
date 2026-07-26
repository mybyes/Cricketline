/**
 * Display-only odds service.
 *
 * Resolution order:
 *   1. the-odds-api.com (THE_ODDS_API_KEY) — h2h match rates, matched by team names
 *   2. External feed (ODDS_API_URL) when configured
 *   3. Seed boards for known demo match ids
 *   4. null (clients may synth rates from score)
 */
import axios from 'axios'
import { SEED_MATCHES } from '../data/seed'
import { seedOdds, SEED_ODDS } from '../data/seedOdds'
import type { MatchOddsBoard, OddsDirection, SessionMarket, TeamOdds } from '../types/odds'
import { ODDS_DISCLAIMER } from '../types/odds'
import { getMatchScore, SEED_MODE } from './cricapi'
import { buildSessionLadder } from '../lib/sessionLadder'
import { findBoardForTeams, theOddsConfigured } from './theOddsApi'

const FEED_URL = (process.env.ODDS_API_URL ?? '').trim().replace(/\/$/, '')
const FEED_KEY = (process.env.ODDS_API_KEY ?? '').trim()

/** In-memory live boards for seed simulation (per process). */
const liveBoards = new Map<string, MatchOddsBoard>()

function dirOf(next: number, prev: number): OddsDirection {
  if (next > prev + 0.001) return 'up'
  if (next < prev - 0.001) return 'down'
  return 'same'
}

function jitter(n: number, pct = 0.012): number {
  const delta = n * pct * (Math.random() * 2 - 1)
  return Math.max(1.01, Math.round((n + delta) * 100) / 100)
}

function jitterLine(n: number): number {
  const delta = Math.random() < 0.35 ? (Math.random() < 0.5 ? -1 : 1) : 0
  return Math.max(1, n + delta)
}

/** Advance seed boards so the demo "line" moves while SSE clients are connected. */
export function tickSeedOdds(matchIds: string[]): MatchOddsBoard[] {
  const out: MatchOddsBoard[] = []
  for (const id of matchIds) {
    const base = liveBoards.get(id) ?? seedOdds(id)
    if (!base) continue
    if (base.suspended) {
      out.push(base)
      continue
    }

    const matchOdds: TeamOdds[] = base.matchOdds.map((o) => {
      const back = jitter(o.back)
      return { ...o, back, lay: undefined, dir: dirOf(back, o.back) }
    })

    const sessions: SessionMarket[] = base.sessions
      .filter((s) => !/fall of|wicket/i.test(s.name))
      .map((s) => {
        if (s.status !== 'open') return { ...s, dir: 'same' as const }
        const line = jitterLine(s.line)
        return {
          ...s,
          line,
          yes: line,
          no: line + 1,
          dir: dirOf(line, s.line),
        }
      })

    const next: MatchOddsBoard = {
      ...base,
      source: 'seed',
      displayOnly: true,
      disclaimer: ODDS_DISCLAIMER,
      matchOdds,
      sessions,
      updatedAt: Date.now(),
    }
    liveBoards.set(id, next)
    out.push(next)
  }
  return out
}

function normalizeBoard(raw: unknown, matchId: string): MatchOddsBoard | null {
  if (!raw || typeof raw !== 'object') return null
  const o = raw as Partial<MatchOddsBoard> & { data?: Partial<MatchOddsBoard> }
  const board = (o.matchOdds ? o : o.data) as Partial<MatchOddsBoard> | undefined
  if (!board || !Array.isArray(board.matchOdds)) return null

  const matchOdds: TeamOdds[] = board.matchOdds.map((row) => ({
    team: String(row.team ?? ''),
    shortname: row.shortname ? String(row.shortname) : undefined,
    back: Number(row.back) || 0,
    lay: undefined,
    dir: (row.dir === 'up' || row.dir === 'down' ? row.dir : 'same') as OddsDirection,
  })).filter((r) => r.team && r.back > 0)

  const sessions: SessionMarket[] = Array.isArray(board.sessions)
    ? board.sessions
      .map((s, i) => {
        const line = Number(s.line) || 0
        const yes = Number(s.yes) || line
        const no = Number(s.no) || (yes > 0 ? yes + 1 : 0)
        return {
          id: String(s.id ?? `s${i}`),
          name: String(s.name ?? 'Session'),
          line,
          yes: yes || undefined,
          no: no || undefined,
          status: (s.status === 'suspended' || s.status === 'settled' ? s.status : 'open') as SessionMarket['status'],
          dir: (s.dir === 'up' || s.dir === 'down' ? s.dir : 'same') as OddsDirection,
        }
      })
      .filter((s) => !/fall of|wicket/i.test(s.name))
    : []

  if (!matchOdds.length) return null

  return {
    matchId: String(board.matchId ?? matchId),
    source: 'feed',
    displayOnly: true,
    disclaimer: typeof board.disclaimer === 'string' ? board.disclaimer : ODDS_DISCLAIMER,
    matchOdds,
    sessions,
    updatedAt: typeof board.updatedAt === 'number' ? board.updatedAt : Date.now(),
    suspended: !!board.suspended,
  }
}

async function fetchFromFeed(matchId: string): Promise<MatchOddsBoard | null> {
  if (!FEED_URL) return null
  const url = FEED_URL.includes('{id}')
    ? FEED_URL.replace('{id}', encodeURIComponent(matchId))
    : `${FEED_URL}/match/${encodeURIComponent(matchId)}/odds`
  const headers: Record<string, string> = { Accept: 'application/json' }
  if (FEED_KEY) headers.Authorization = `Bearer ${FEED_KEY}`
  try {
    const { data } = await axios.get(url, { headers, timeout: 6_000 })
    return normalizeBoard(data, matchId)
  } catch {
    return null
  }
}

async function resolveTeams(matchId: string): Promise<string[] | null> {
  const seeded = SEED_MATCHES.find((m) => m.id === matchId)
  if (seeded?.teams?.length) return seeded.teams
  try {
    const sc = await getMatchScore(matchId)
    if (sc && Array.isArray((sc as { teams?: string[] }).teams)) {
      const teams = (sc as { teams: string[] }).teams
      if (teams.length >= 2) return teams
    }
  } catch { /* ignore */ }
  return null
}

async function attachSessionLadder(
  board: MatchOddsBoard,
  matchId: string,
): Promise<MatchOddsBoard> {
  try {
    const sc = await getMatchScore(matchId) as {
      matchType?: string
      name?: string
      score?: { r: number; o: number; inning: string }[]
      teamInfo?: { shortname: string; name: string }[]
      scorecard?: { inning: string }[]
    } | null
    if (!sc) return board
    const active = sc.score?.[sc.score.length - 1]
    const innName = sc.scorecard?.[sc.scorecard.length - 1]?.inning ?? ''
    const battingShort =
      sc.teamInfo?.find((t) => innName.toLowerCase().includes((t.name ?? '').toLowerCase().split(' ')[0] ?? '___'))?.shortname
      ?? sc.teamInfo?.[0]?.shortname
    return {
      ...board,
      sessions: buildSessionLadder({
        matchType: sc.matchType,
        matchName: sc.name,
        currentOvers: active?.o ?? 0,
        currentRuns: active?.r ?? 0,
        ballsFaced: active ? Math.floor(active.o) * 6 + Math.round((active.o % 1) * 10) : 0,
        battingShort,
      }),
    }
  } catch {
    return board
  }
}

async function fetchFromTheOddsApi(matchId: string, teamsHint?: string[]): Promise<MatchOddsBoard | null> {
  if (!theOddsConfigured()) return null
  const teams = teamsHint ?? await resolveTeams(matchId)
  if (!teams || teams.length < 2) return null
  // Odds API = both teams' h2h; session attached in getMatchOdds from live score
  return findBoardForTeams(matchId, teams)
}

export async function getMatchOdds(
  matchId: string,
  opts?: { teams?: string[] },
): Promise<MatchOddsBoard | null> {
  let board: MatchOddsBoard | null = null

  // 1) the-odds-api.com (real bookmaker h2h)
  board = await fetchFromTheOddsApi(matchId, opts?.teams)

  // 2) Custom licensed feed URL
  if (!board && FEED_URL) {
    board = await fetchFromFeed(matchId)
  }

  // 3) Seed simulator
  if (!board) {
    const live = liveBoards.get(matchId)
    if (live) board = live
    else {
      const seeded = seedOdds(matchId)
      if (seeded) {
        liveBoards.set(matchId, seeded)
        board = seeded
      }
    }
  }

  if (!board) {
    if (SEED_MODE) return null
    return null
  }

  // Always refresh to *one* next session from live score (never full ladder).
  // fetchFromTheOddsApi already attached; re-run is cheap and keeps progress in sync.
  return attachSessionLadder(board, matchId)
}

export async function getLiveOddsBoards(
  liveMatchIds: string[],
  liveMatches?: { id: string; teams: string[] }[],
): Promise<MatchOddsBoard[]> {
  const byId = new Map((liveMatches ?? []).map((m) => [m.id, m.teams]))

  if (theOddsConfigured() || FEED_URL) {
    const boards = await Promise.all(
      liveMatchIds.map((id) => getMatchOdds(id, { teams: byId.get(id) })),
    )
    return boards.filter((b): b is MatchOddsBoard => !!b)
  }

  const ids = liveMatchIds.filter((id) => liveBoards.has(id) || SEED_ODDS[id])
  const seeded = !ids.length && SEED_MODE
    ? await tickSeedOdds(Object.keys(SEED_ODDS).filter((k) => k.startsWith('seed-live')))
    : await tickSeedOdds(ids.length ? ids : liveMatchIds.filter((id) => SEED_ODDS[id]))
  return Promise.all(seeded.map((b) => attachSessionLadder(b, b.matchId)))
}

export function oddsFeedConfigured() {
  return theOddsConfigured() || !!FEED_URL
}
