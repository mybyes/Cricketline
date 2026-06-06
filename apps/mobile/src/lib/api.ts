import type { LiveMatchesResponse } from '../types/match'

const API_URL = process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:3000'

export function getApiUrl() {
  return API_URL
}

export async function fetchLiveMatches(): Promise<LiveMatchesResponse> {
  const res = await fetch(`${API_URL}/matches/live`)
  if (!res.ok) throw new Error(`HTTP ${res.status}`)
  return res.json()
}
