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

export function parseDayFromStatus(status: string): number | null {
  const m = status.match(/day\s*(\d+)/i)
  return m ? parseInt(m[1], 10) : null
}

/** Parse session hints from Test match status text */
export function parseSessions(status: string) {
  const markers = ['lunch', 'tea', 'stumps', 'innings break', 'rain', 'bad light']
  const lower = status.toLowerCase()
  const hits = markers.filter((m) => lower.includes(m))
  const day = parseDayFromStatus(status)
  return { status, markers: hits, day, isBreak: hits.length > 0 }
}

export function inningRunRate(r: number, o: number) {
  if (!o) return null
  return (r / o).toFixed(2)
}
