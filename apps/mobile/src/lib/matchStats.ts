import type { ScorecardData } from '../types/scorecard'

export function currentRunRate(overs: number, runs: number) {
  if (!overs || overs <= 0) return null
  return runs / overs
}

export function requiredRunRate(chasing: { r: number; o: number }, target: number, totalOvers = 20) {
  const remaining = target - chasing.r
  const oversLeft = totalOvers - chasing.o
  if (remaining <= 0 || oversLeft <= 0) return null
  return remaining / oversLeft
}

export function chaseTarget(data: ScorecardData) {
  if (data.score.length < 2) return null
  const first = data.score[0]
  return first.r + 1
}

export function liveRates(data: ScorecardData) {
  const active = data.score[data.score.length - 1]
  if (!active) return null
  const crr = currentRunRate(active.o, active.r)
  const target = chaseTarget(data)
  const rrr = target && data.score.length >= 2 ? requiredRunRate(active, target, data.matchType === 'odi' ? 50 : 20) : null
  return { crr, rrr, target, runs: active.r, wickets: active.w, overs: active.o }
}

/** Parse session hints from Test match status text */
export function parseSessions(status: string) {
  const markers = ['lunch', 'tea', 'stumps', 'session', 'day']
  const lower = status.toLowerCase()
  const hits = markers.filter((m) => lower.includes(m))
  return { status, markers: hits, isTestSession: hits.length > 0 }
}
