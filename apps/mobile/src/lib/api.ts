import type { LiveMatchesResponse } from '../types/match'
import type { ScorecardResponse } from '../types/scorecard'

const API_URL = process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:3000'

export async function fetchLiveMatches(): Promise<LiveMatchesResponse> {
  const res = await fetch(`${API_URL}/matches/live`)
  if (!res.ok) throw new Error(`HTTP ${res.status}`)
  return res.json()
}

export async function fetchMatchScore(matchId: string): Promise<ScorecardResponse> {
  const res = await fetch(`${API_URL}/match/${matchId}/score`)
  if (!res.ok) throw new Error(`HTTP ${res.status}`)
  return res.json()
}
