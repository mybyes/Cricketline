import type { ScorecardData } from '../types/scorecard'

function oversToBalls(o: number): number {
  const whole = Math.floor(o)
  return whole * 6 + Math.round((o - whole) * 10)
}

/** Limited-overs chase summary for the top scoreboard. */
export function getChaseLine(data: ScorecardData): {
  target: number
  need: number
  ballsLeft: number
  rrr: number
  team: string
} | null {
  const innings = data.scorecard ?? []
  if (innings.length < 2) return null
  const cur = innings[innings.length - 1]
  const totals = cur.totals
  if (!totals) return null

  const balls = oversToBalls(totals.o)
  const oversTotal = data.matchType?.toLowerCase() === 'odi' ? 50
    : data.matchType?.toLowerCase() === 'test' ? null
    : 20
  if (!oversTotal) return null

  const target = (innings[0].totals?.r ?? data.score?.[0]?.r ?? 0) + 1
  const ballsLeft = Math.max(0, oversTotal * 6 - balls)
  const need = Math.max(0, target - totals.r)
  const rrr = ballsLeft > 0 ? need / (ballsLeft / 6) : 0
  const team = cur.inning.replace(/ inning.*$/i, '')
  return { target, need, ballsLeft, rrr, team }
}
