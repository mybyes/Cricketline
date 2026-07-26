/**
 * the-odds-api.com → display-only MatchOddsBoard.
 *
 * Provides match-winner (h2h) decimal prices. Does NOT provide Indian session /
 * fancy markets — session is only filled when a `totals` line exists.
 *
 * Matching: CricAPI match id → team names → fuzzy match to Odds API event.
 * Quota-friendly: one cached pull per sport, reused across matches.
 */
import axios from 'axios'
import type { MatchOddsBoard, TeamOdds } from '../types/odds'
import { ODDS_DISCLAIMER } from '../types/odds'

const API_KEY = (process.env.THE_ODDS_API_KEY ?? process.env.ODDS_API_KEY ?? '').trim()
const BASE = 'https://api.the-odds-api.com/v4'
const REGIONS = (process.env.THE_ODDS_REGIONS ?? 'uk,au').trim()
/** Cache window — keep under free-tier burn. */
const CACHE_MS = Math.max(30_000, Number(process.env.THE_ODDS_CACHE_MS) || 90_000)

/**
 * Full cricket catalogue on the-odds-api.com (major series).
 * We only *poll* keys that are currently `active` (in season) to save quota;
 * inactive series auto-join when the sports list flips active.
 */
export const CRICKET_SERIES = [
  { key: 'cricket_ipl', title: 'IPL' },
  { key: 'cricket_the_hundred', title: 'The Hundred' },
  { key: 'cricket_international_t20', title: 'International T20' },
  { key: 'cricket_test_match', title: 'Test Matches' },
  { key: 'cricket_odi', title: 'One Day Internationals' },
  { key: 'cricket_big_bash', title: 'Big Bash' },
  { key: 'cricket_t20_blast', title: 'T20 Blast' },
  { key: 'cricket_psl', title: 'Pakistan Super League' },
  { key: 'cricket_caribbean_premier_league', title: 'CPL T20' },
  { key: 'cricket_asia_cup', title: 'Asia Cup' },
  { key: 'cricket_t20_world_cup', title: 'T20 World Cup' },
  { key: 'cricket_t20_world_cup_womens', title: "T20 Women's World Cup" },
  { key: 'cricket_icc_world_cup', title: 'ICC World Cup' },
  { key: 'cricket_icc_world_cup_womens', title: "ICC Women's World Cup" },
  { key: 'cricket_icc_trophy', title: 'ICC Champions Trophy' },
] as const

const ALL_CRICKET_KEYS = CRICKET_SERIES.map((s) => s.key)

/** Common short ↔ full aliases so CricAPI names match Odds API events. */
const TEAM_ALIASES: Record<string, string[]> = {
  'manchester super giants': ['msg', 'manchester originals', 'manchester'],
  'birmingham phoenix': ['birm', 'birmingham'],
  'london spirit': ['lond', 'spirit'],
  'oval invincibles': ['oval', 'invincibles'],
  'northern superchargers': ['nort', 'superchargers'],
  'trent rockets': ['tren', 'rockets'],
  'welsh fire': ['wels', 'fire'],
  'southern brave': ['sout', 'brave'],
  'mumbai indians': ['mi', 'mumbai'],
  'royal challengers bengaluru': ['rcb', 'royal challengers bangalore', 'bengaluru', 'bangalore'],
  'chennai super kings': ['csk', 'chennai'],
  'kolkata knight riders': ['kkr', 'kolkata'],
  'delhi capitals': ['dc', 'delhi'],
  'rajasthan royals': ['rr', 'rajasthan'],
  'sunrisers hyderabad': ['srh', 'hyderabad', 'sunrisers'],
  'punjab kings': ['pbks', 'punjab', 'kings xi'],
  'gujarat titans': ['gt', 'gujarat'],
  'lucknow super giants': ['lsg', 'lucknow'],
  'west indies': ['wi', 'windies'],
  'south africa': ['sa', 'proteas'],
  'new zealand': ['nz', 'black caps'],
  'sri lanka': ['sl'],
  'afghanistan': ['afg'],
  'bangladesh': ['ban'],
  'australia': ['aus'],
  'england': ['eng'],
  'india': ['ind'],
  'pakistan': ['pak'],
}

interface OddsOutcome { name: string; price: number; point?: number }
interface OddsMarket { key: string; outcomes: OddsOutcome[] }
interface OddsBookmaker { key: string; title: string; markets: OddsMarket[] }
export interface OddsEvent {
  id: string
  sport_key: string
  sport_title: string
  commence_time: string
  home_team: string
  away_team: string
  bookmakers: OddsBookmaker[]
}

interface SportRow { key: string; group: string; active: boolean; has_outrights?: boolean }

let eventsCache: { at: number; events: OddsEvent[] } | null = null
let sportsCache: { at: number; activeKeys: string[]; allKeys: string[] } | null = null
/** Previous prices for direction blinks. */
const prevBack = new Map<string, number>()

export function theOddsConfigured(): boolean {
  return !!API_KEY
}

function norm(s: string): string {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, ' ').replace(/\s+/g, ' ').trim()
}

function shortname(team: string): string {
  const parts = team.trim().split(/\s+/).filter(Boolean)
  if (parts.length === 1) return parts[0].slice(0, 4).toUpperCase()
  return parts.map((p) => p[0]).join('').slice(0, 4).toUpperCase()
}

function aliasHit(full: string, other: string): boolean {
  const aliases = TEAM_ALIASES[full]
  if (!aliases) return false
  return aliases.some((a) => other === a || other.includes(a) || a.includes(other))
}

/** Loose team equality for MSG ↔ Manchester Super Giants, etc. */
export function teamsFuzzyMatch(a: string, b: string): boolean {
  const na = norm(a)
  const nb = norm(b)
  if (!na || !nb) return false
  if (na === nb) return true
  if (na.includes(nb) || nb.includes(na)) return true
  if (aliasHit(na, nb) || aliasHit(nb, na)) return true
  // Check if either side matches a known full name via alias of the other
  for (const [full, aliases] of Object.entries(TEAM_ALIASES)) {
    const aIs = na === full || aliases.includes(na) || na.includes(full)
    const bIs = nb === full || aliases.includes(nb) || nb.includes(full)
    if (aIs && bIs) return true
  }
  const ta = na.split(' ').filter((w) => w.length > 2)
  const tb = new Set(nb.split(' ').filter((w) => w.length > 2))
  const hits = ta.filter((w) => tb.has(w)).length
  return hits >= 1 && hits >= Math.min(2, Math.max(ta.length, [...tb].length) > 3 ? 2 : 1)
}

function eventMatchesTeams(ev: OddsEvent, teams: string[]): boolean {
  if (teams.length < 2) return false
  const [t0, t1] = teams
  const home = ev.home_team
  const away = ev.away_team
  return (
    (teamsFuzzyMatch(t0, home) && teamsFuzzyMatch(t1, away))
    || (teamsFuzzyMatch(t0, away) && teamsFuzzyMatch(t1, home))
  )
}

function median(nums: number[]): number {
  if (!nums.length) return 0
  const s = [...nums].sort((a, b) => a - b)
  const m = Math.floor(s.length / 2)
  return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2
}

/** Aggregate h2h back prices across bookmakers (ignore lay / draw). */
function h2hPrices(ev: OddsEvent): Map<string, number> {
  const buckets = new Map<string, number[]>()
  for (const bm of ev.bookmakers ?? []) {
    const mkt = bm.markets?.find((m) => m.key === 'h2h')
    if (!mkt) continue
    for (const o of mkt.outcomes ?? []) {
      if (!o?.name || o.name.toLowerCase() === 'draw') continue
      if (!(o.price > 1)) continue
      const list = buckets.get(o.name) ?? []
      list.push(o.price)
      buckets.set(o.name, list)
    }
  }
  const out = new Map<string, number>()
  for (const [name, prices] of buckets) {
    out.set(name, Math.round(median(prices) * 100) / 100)
  }
  return out
}

/** Optional totals → one session line (Over point). */
function totalsSession(ev: OddsEvent): MatchOddsBoard['sessions'] {
  for (const bm of ev.bookmakers ?? []) {
    const mkt = bm.markets?.find((m) => m.key === 'totals')
    const over = mkt?.outcomes?.find((o) => /over/i.test(o.name) && o.point != null)
    if (over?.point != null) {
      return [{
        id: 'totals',
        name: 'Match Total',
        line: Math.round(over.point),
        status: 'open',
        dir: 'same',
      }]
    }
  }
  return []
}

function dirOf(key: string, next: number): TeamOdds['dir'] {
  const prev = prevBack.get(key)
  prevBack.set(key, next)
  if (prev == null) return 'same'
  if (next > prev + 0.01) return 'up'
  if (next < prev - 0.01) return 'down'
  return 'same'
}

export function eventToBoard(ev: OddsEvent, matchId: string, teams?: string[]): MatchOddsBoard | null {
  const prices = h2hPrices(ev)
  if (prices.size < 2) return null

  const order = teams?.length
    ? teams
    : [ev.home_team, ev.away_team]

  const matchOdds: TeamOdds[] = []
  for (const team of order) {
    let price = 0
    let name = team
    for (const [n, p] of prices) {
      if (teamsFuzzyMatch(team, n)) {
        price = p
        name = n
        break
      }
    }
    if (!price) continue
    matchOdds.push({
      team: name,
      shortname: shortname(name),
      back: price,
      dir: dirOf(`${matchId}:${name}`, price),
    })
  }

  // Fallback: raw price map order
  if (matchOdds.length < 2) {
    matchOdds.length = 0
    for (const [name, price] of prices) {
      matchOdds.push({
        team: name,
        shortname: shortname(name),
        back: price,
        dir: dirOf(`${matchId}:${name}`, price),
      })
    }
  }

  if (matchOdds.length < 2) return null

  return {
    matchId,
    source: 'feed',
    displayOnly: true,
    disclaimer: ODDS_DISCLAIMER,
    matchOdds: matchOdds.slice(0, 2),
    sessions: totalsSession(ev),
    updatedAt: Date.now(),
    suspended: false,
  }
}

/** Active (in-season) cricket keys to poll — never burn quota on off-season series. */
async function listActiveCricketSports(): Promise<string[]> {
  const now = Date.now()
  if (sportsCache && now - sportsCache.at < 30 * 60_000) return sportsCache.activeKeys
  try {
    const { data } = await axios.get<SportRow[]>(`${BASE}/sports/`, {
      params: { apiKey: API_KEY, all: true },
      timeout: 8_000,
    })
    const cricket = (data ?? []).filter(
      (s) => s.group === 'Cricket' || s.key.startsWith('cricket_'),
    )
    const activeKeys = cricket.filter((s) => s.active).map((s) => s.key)
    const discovered = cricket.map((s) => s.key)
    const allKeys = [...new Set([...discovered, ...ALL_CRICKET_KEYS])]
    // Prefer active; if API returns none, fall back to known majors (may 404 empty).
    const poll = activeKeys.length ? activeKeys : ALL_CRICKET_KEYS.slice(0, 5)
    sportsCache = { at: now, activeKeys: poll, allKeys }
    return poll
  } catch {
    return ['cricket_the_hundred', 'cricket_international_t20', 'cricket_test_match']
  }
}

/** Catalogue + currently polled series (for /health). */
export function cricketSeriesCoverage() {
  return {
    catalogue: CRICKET_SERIES.map((s) => s.title),
    polling: sportsCache?.activeKeys ?? [],
    allKeys: sportsCache?.allKeys ?? [...ALL_CRICKET_KEYS],
  }
}

async function fetchSportOdds(sport: string): Promise<OddsEvent[]> {
  try {
    const { data } = await axios.get<OddsEvent[]>(`${BASE}/sports/${sport}/odds`, {
      params: {
        apiKey: API_KEY,
        regions: REGIONS,
        markets: 'h2h',
        oddsFormat: 'decimal',
      },
      timeout: 10_000,
    })
    return Array.isArray(data) ? data : []
  } catch {
    return []
  }
}

/** Refresh all in-season cricket events (cached). */
export async function getCricketOddsEvents(force = false): Promise<OddsEvent[]> {
  if (!API_KEY) return []
  const now = Date.now()
  if (!force && eventsCache && now - eventsCache.at < CACHE_MS) return eventsCache.events

  const sports = await listActiveCricketSports()
  const chunks = await Promise.all(sports.map((s) => fetchSportOdds(s)))
  const events = chunks.flat()
  eventsCache = { at: now, events }
  return events
}

export async function findBoardForTeams(
  matchId: string,
  teams: string[],
): Promise<MatchOddsBoard | null> {
  if (!API_KEY || teams.length < 2) return null
  const events = await getCricketOddsEvents()
  const hit = events.find((ev) => eventMatchesTeams(ev, teams))
  if (!hit) return null
  return eventToBoard(hit, matchId, teams)
}
