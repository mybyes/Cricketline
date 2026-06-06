import axios from 'axios'
import type { Redis } from 'ioredis'
import { cached, CACHE_KEYS, ALL_MATCHES_TTL } from './cache'

const BASE = 'https://api.cricapi.com/v1'
const KEY  = process.env.CRICAPI_KEY!

function checkResponse(data: { status?: string; reason?: string; message?: string }) {
  if (data.status !== 'success') {
    throw new Error(data.reason ?? data.message ?? 'CricAPI error')
  }
}

async function cricGet<T>(path: string, params: Record<string, string | number> = {}): Promise<T> {
  const { data } = await axios.get(`${BASE}/${path}`, {
    params: { apikey: KEY, ...params },
  })
  checkResponse(data)
  return data.data as T
}

async function fetchAllMatches() {
  return cricGet<Match[]>('matches', { offset: 0 })
}

export async function getAllMatchesCached(redis: Redis) {
  return cached(redis, CACHE_KEYS.allMatches(), ALL_MATCHES_TTL, fetchAllMatches)
}

/** Probed once per process — avoids burning 2 CricAPI calls when currentMatches isn't on the key. */
let useCurrentMatches: boolean | null = null

async function resolveCurrentMatchesEndpoint(): Promise<boolean> {
  if (useCurrentMatches !== null) return useCurrentMatches
  try {
    const { data } = await axios.get(`${BASE}/currentMatches`, {
      params: { apikey: KEY, offset: 0 },
      timeout: 8_000,
    })
    useCurrentMatches = data.status === 'success' && Array.isArray(data.data)
  } catch {
    useCurrentMatches = false
  }
  return useCurrentMatches
}

export async function getLiveMatches(redis: Redis) {
  if (await resolveCurrentMatchesEndpoint()) {
    const { data } = await axios.get(`${BASE}/currentMatches`, {
      params: { apikey: KEY, offset: 0 },
    })
    if (data.status === 'success') return data.data as Match[]
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

export async function getMatchScore(matchId: string) {
  return cricGet('match_scorecard', { id: matchId })
}

export async function getMatchSquad(matchId: string) {
  return cricGet('match_squad', { id: matchId })
}

export async function getMatchBbb(matchId: string) {
  try {
    return await cricGet<{ ballNbr: number; overNum: number; innings: number; event: string; runs: number; batsman: string; bowler: string }[]>(
      'match_bbb',
      { id: matchId },
    )
  } catch {
    return []
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
  const data = await cricGet<{ id: string; name: string; startDate: string; endDate: string; odi: number; t20: number; test: number }[]>(
    'series',
    { offset: 0 },
  )
  return data.slice(0, limit)
}

export async function getSeriesTable(seriesId: string) {
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
