import { getApiUrl } from './apiUrl'

const API = getApiUrl()

export interface Match {
  id: string
  name: string
  matchType?: string
  status: string
  venue: string
  date: string
  dateTimeGMT: string
  teams: string[]
  teamInfo: { name: string; shortname: string; img: string }[]
  score?: { r: number; w: number; o: number; inning: string }[]
  series_id?: string
  matchStarted: boolean
  matchEnded: boolean
}

export interface SeriesItem {
  id: string
  name: string
}

export interface StandingRow {
  team: string
  m: number
  w: number
  l: number
  pts: number
}

export interface ApiResult<T> {
  data: T
  stale: boolean
  cachedAt?: number
  error?: string
}

export interface BatsmanRow {
  batsman: { id: string; name: string }
  'dismissal-text': string
  r: number
  b: number
  '4s': number
  '6s': number
  sr: number
}

export interface BowlerRow {
  bowler: { id: string; name: string }
  o: number
  m: number
  r: number
  w: number
  eco: number
}

export interface FallOfWicket { wkt: number; player: string; runs: number; over: number }

export interface InningScorecard {
  inning: string
  batting: BatsmanRow[]
  bowling: BowlerRow[]
  extras?: { t: number; b?: number; lb?: number; w?: number; nb?: number; p?: number }
  totals?: { r: number; w: number; o: number }
  fallOfWickets?: FallOfWicket[]
  didNotBat?: string[]
  overRuns?: number[]
}

export interface SquadTeam {
  team: string
  players: { player: { id: string; name: string }; role?: string }[]
}

export function getSquad(id: string) {
  return get<SquadTeam[]>(`/match/${id}/squad`, 300)
}

export interface MatchHistoryData {
  teams?: string[]
  headToHead: Match[]
  team1Recent: Match[]
  team2Recent: Match[]
}

export function getMatchHistory(id: string) {
  return get<MatchHistoryData>(`/match/${id}/history`, 300)
}

export interface ScorecardData extends Match {
  tossWinner?: string
  tossChoice?: string
  scorecard: InningScorecard[]
}

export interface BbbBall {
  ballNbr?: number
  overNum?: number
  innings?: number
  event?: string
  runs?: number
  batsman?: string
  bowler?: string
}

async function get<T>(path: string, revalidate = 15): Promise<ApiResult<T>> {
  try {
    const res = await fetch(`${API}${path}`, { next: { revalidate } })
    const body = await res.json().catch(() => ({})) as {
      success?: boolean
      data?: T
      error?: string
      stale?: boolean
      cachedAt?: number
    }
    if (body.success && body.data != null) {
      return {
        data: body.data,
        stale: !!body.stale,
        cachedAt: typeof body.cachedAt === 'number' ? body.cachedAt : undefined,
      }
    }
    return { data: [] as T, stale: false, error: body.error ?? `API ${res.status}` }
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : 'Network error'
    return { data: [] as T, stale: false, error: msg }
  }
}

export function getLiveMatches() {
  return get<Match[]>('/matches/live', 10)
}

export function getRecentMatches() {
  return get<Match[]>('/matches/recent', 60)
}

export function getUpcomingMatches() {
  return get<Match[]>('/matches/upcoming', 120)
}

export interface Offer {
  id: string
  title: string
  brand: string
  perk: string
  code: string
  category: 'fantasy' | 'tickets' | 'merch' | 'streaming'
  ctaUrl: string | null
  placeholder: boolean
}

export interface DailyData {
  matchOfTheDay: Match | null
  offers: Offer[]
}

export function getDaily() {
  return get<DailyData>('/daily', 120)
}

export interface RankRow { rank: number; team: string; short: string; rating: number; points?: number }
export interface PlayerRank { rank: number; name: string; team: string; rating: number }
export interface Rankings {
  teams: { test: RankRow[]; odi: RankRow[]; t20: RankRow[] }
  batters: { test: PlayerRank[]; odi: PlayerRank[]; t20: PlayerRank[] }
  bowlers: { test: PlayerRank[]; odi: PlayerRank[]; t20: PlayerRank[] }
  updated: string
}
export type TeamCategory = 'international' | 'league' | 'other'
export interface TeamSummary { name: string; short: string; matches: number; live: number; upcoming: number; category: TeamCategory }

export interface SearchResults {
  query: string
  matches: Match[]
  teams: { name: string; short: string }[]
  series: { id: string; name: string }[]
}

export function search(q: string) {
  return get<SearchResults>(`/search?q=${encodeURIComponent(q)}`, 30)
}

export function getRankings() {
  return get<Rankings>('/rankings', 3600)
}

export function getTeams() {
  return get<TeamSummary[]>('/teams', 600)
}

export interface SeriesStatRun { name: string; runs: number; balls: number }
export interface SeriesStatWkt { name: string; wkts: number; runs: number }
export interface SeriesTableFull {
  seriesName: string
  standings: StandingRow[]
  matches: Match[]
  topRuns?: SeriesStatRun[]
  topWickets?: SeriesStatWkt[]
}

export function getSeriesTableFull(id: string) {
  return get<SeriesTableFull>(`/series/${id}/table`, 300)
}

export function getScorecard(id: string) {
  return get<ScorecardData>(`/match/${id}/score`, 12)
}

export function getBallByBall(id: string) {
  return get<BbbBall[]>(`/match/${id}/bbb`, 12)
}

export function getSeriesList() {
  return get<SeriesItem[]>('/series', 300)
}

export function getSeriesTable(id: string) {
  return get<{ seriesName: string; standings: StandingRow[] }>(`/series/${id}/table`, 120)
}

export const FALLBACK_SERIES: SeriesItem[] = [
  { id: 'ipl', name: 'Indian Premier League 2026' },
  { id: 't20blast', name: 'Vitality T20 Blast 2026' },
  { id: 'test', name: 'International Tests' },
  { id: 'odi', name: 'ICC Cricket World Cup League Two' },
  { id: 'wt20', name: "Women's T20 World Cup 2026" },
]
