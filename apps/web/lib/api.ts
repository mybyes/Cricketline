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
