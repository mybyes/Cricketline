import type { LiveMatchesResponse } from '../types/match'
import type { ScorecardResponse } from '../types/scorecard'
import type { BbbBall, MatchHistoryData, SeriesItem, SeriesTableData, SquadTeam } from '../types/extras'

import { getApiUrl as resolveApiUrl } from './apiUrl'

const API_URL = resolveApiUrl()

export function getApiUrl() {
  return API_URL
}

/** Read-only API — never throws; keeps UI able to show last cached layer */
async function api<T extends { success: boolean }>(path: string, init?: RequestInit): Promise<T> {
  try {
    const res = await fetch(`${API_URL}${path}`, init)
    const body = await res.json().catch(() => ({ success: false, error: `HTTP ${res.status}` })) as T
    if (body.success) return body
    return {
      ...body,
      success: false,
      error: (body as { error?: string }).error ?? `HTTP ${res.status}`,
    } as unknown as T
  } catch (e) {
    return {
      success: false,
      error: e instanceof Error ? e.message : 'Network error',
    } as unknown as T
  }
}

async function apiList(path: string): Promise<LiveMatchesResponse> {
  const res = await api<LiveMatchesResponse>(path)
  if (res.success) return res
  return { success: true, data: [], stale: true }
}

export async function fetchLiveMatches(): Promise<LiveMatchesResponse> {
  return apiList('/matches/live')
}

export async function fetchUpcomingMatches(): Promise<LiveMatchesResponse> {
  return apiList('/matches/upcoming')
}

export async function fetchMatchScore(matchId: string): Promise<ScorecardResponse> {
  const res = await api<ScorecardResponse>(`/match/${matchId}/score`)
  if (res.success) return res
  return { success: false, data: undefined as unknown as ScorecardResponse['data'], stale: true }
}

export async function fetchMatchSquad(matchId: string) {
  return api<{ success: boolean; data: SquadTeam[]; error?: string }>(`/match/${matchId}/squad`)
}

export async function fetchMatchBbb(matchId: string) {
  return api<{ success: boolean; data: BbbBall[]; error?: string; stale?: boolean }>(`/match/${matchId}/bbb`)
}

export async function fetchMatchHistory(matchId: string) {
  return api<{ success: boolean; data: MatchHistoryData; error?: string }>(`/match/${matchId}/history`)
}

export async function fetchSeriesTable(seriesId: string) {
  return api<{ success: boolean; data: SeriesTableData; error?: string }>(`/series/${seriesId}/table`)
}

export async function fetchSeriesList() {
  return api<{ success: boolean; data: SeriesItem[]; error?: string }>('/series')
}

export async function fetchRecentMatches() {
  return apiList('/matches/recent')
}

export async function getFavoritesRemote(deviceId: string) {
  return api<{ success: boolean; data: { match_id: string; match_name: string; match_data: Record<string, unknown> }[] }>(
    `/favorites?device_id=${encodeURIComponent(deviceId)}`
  )
}

export async function addFavoriteRemote(
  deviceId: string,
  matchId: string,
  matchName: string,
  matchData: Record<string, unknown>
) {
  return api('/favorites', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ device_id: deviceId, match_id: matchId, match_name: matchName, match_data: matchData }),
  })
}

export async function removeFavoriteRemote(deviceId: string, matchId: string) {
  return api(`/favorites/${matchId}?device_id=${encodeURIComponent(deviceId)}`, { method: 'DELETE' })
}

export async function registerDevice(
  deviceId: string,
  pushToken: string,
  platform: string,
  opts: { authToken?: string | null; notifyEnabled?: boolean } = {},
) {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' }
  if (opts.authToken) headers.Authorization = `Bearer ${opts.authToken}`
  return api('/devices/register', {
    method: 'POST',
    headers,
    body: JSON.stringify({
      device_id: deviceId,
      push_token: pushToken,
      platform,
      notify_enabled: opts.notifyEnabled ?? true,
    }),
  })
}
