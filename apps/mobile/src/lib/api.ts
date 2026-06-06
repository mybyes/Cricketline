import type { LiveMatchesResponse } from '../types/match'
import type { ScorecardResponse } from '../types/scorecard'

const API_URL = process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:3000'

export function getApiUrl() {
  return API_URL
}

async function api<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${API_URL}${path}`, init)
  if (!res.ok) throw new Error(`HTTP ${res.status}`)
  return res.json()
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
