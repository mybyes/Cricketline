import type { ScorecardData } from '../types/scorecard'
import { chaseTarget, liveRates } from './matchStats'

export function runsPerOverNeeded(data: ScorecardData): number | null {
  const rates = liveRates(data)
  if (!rates?.target || rates.overs == null) return null
  const fmt = data.matchType?.toLowerCase()
  const totalOvers = fmt === 'test' ? 90 : fmt === 'odi' ? 50 : 20
  const remaining = rates.target - rates.runs
  const oversLeft = totalOvers - rates.overs
  if (remaining <= 0 || oversLeft <= 0) return null
  return remaining / oversLeft
}

export function wicketEvery(overs: number, wickets: number): string | null {
  if (!wickets || !overs) return null
  return (overs / wickets).toFixed(1)
}

export function inningsComparison(data: ScorecardData) {
  if (data.score.length < 2) return null
  const [first, second] = data.score
  const rr1 = first.o > 0 ? first.r / first.o : null
  const rr2 = second.o > 0 ? second.r / second.o : null
  return {
    first: { label: first.inning, runs: first.r, overs: first.o, rr: rr1 },
    second: { label: second.inning, runs: second.r, overs: second.o, rr: rr2 },
    delta: rr1 != null && rr2 != null ? rr2 - rr1 : null,
  }
}

export function chaseSummary(data: ScorecardData) {
  const target = chaseTarget(data)
  const active = data.score[data.score.length - 1]
  if (!target || !active) return null
  const needed = target - active.r
  const fmt = data.matchType?.toLowerCase()
  const totalOvers = fmt === 'test' ? 90 : fmt === 'odi' ? 50 : 20
  const oversLeft = totalOvers - active.o
  const ballsLeft = Math.max(0, Math.round(oversLeft * 6))
  return { target, needed, oversLeft, ballsLeft, wicketsLeft: 10 - active.w }
}
