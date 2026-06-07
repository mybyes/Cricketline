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

export async function fetchLiveMatches(): Promise<LiveMatchesResponse> {
  return api('/matches/live')
}

export async function fetchUpcomingMatches(): Promise<LiveMatchesResponse> {
  return api('/matches/upcoming')
}

export async function fetchMatchScore(matchId: string): Promise<ScorecardResponse> {
  return api(`/match/${matchId}/score`)
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
  return api<LiveMatchesResponse>('/matches/recent')
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

export async function registerDevice(deviceId: string, pushToken: string, platform: string) {
  return api('/devices/register', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ device_id: deviceId, push_token: pushToken, platform }),
  })
}
