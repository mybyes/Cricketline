const API = process.env.API_URL ?? process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3000'

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

async function get<T>(path: string, revalidate = 15): Promise<T> {
  const res = await fetch(`${API}${path}`, { next: { revalidate } })
  if (!res.ok) throw new Error(`API ${res.status}`)
  return res.json() as Promise<T>
}

export function getLiveMatches() {
  return get<{ success: boolean; data: Match[] }>('/matches/live', 10)
}

export function getRecentMatches() {
  return get<{ success: boolean; data: Match[] }>('/matches/recent', 60)
}

export function getUpcomingMatches() {
  return get<{ success: boolean; data: Match[] }>('/matches/upcoming', 120)
}

export function getSeriesList() {
  return get<{ success: boolean; data: SeriesItem[] }>('/series', 300)
}

export function getSeriesTable(id: string) {
  return get<{ success: boolean; data: { seriesName: string; standings: StandingRow[] } }>(`/series/${id}/table`, 120)
}
