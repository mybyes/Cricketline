import type { ScorecardData } from './api'

/**
 * Computed win-probability estimate from the match situation (balls + wickets left,
 * required vs current rate). A simple model — like ESPN's Win Probability — NOT betting odds.
 * Returns null unless it's a defined limited-overs chase. Pure + tested in winProbability.test.ts.
 */
export function oversToBalls(o: number): number {
  const whole = Math.floor(o)
  return whole * 6 + Math.round((o - whole) * 10)
}

const clamp = (n: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, n))

export interface WinProbabilityResult {
  pct0: number
  pct1: number
}

export function winProbability(data: ScorecardData): WinProbabilityResult | null {
  const innings = data.scorecard ?? []
  const fmt = data.matchType?.toLowerCase()
  const oversTotal = fmt === 'odi' ? 50 : fmt === 't20' || fmt === 'match' ? 20 : null
  const cur = innings[innings.length - 1]
  if (innings.length < 2 || !oversTotal || !cur?.totals) return null

  const target = (innings[0].totals?.r ?? 0) + 1
  const balls = oversToBalls(cur.totals.o)
  const ballsLeft = oversTotal * 6 - balls
  const need = target - cur.totals.r
  if (ballsLeft <= 0 || need <= 0) return null

  const wktsLeft = 10 - cur.totals.w
  const reqRR = need / (ballsLeft / 6)
  const curRR = cur.totals.r / (balls / 6)

  let p = 0.5
  p += (curRR - reqRR) * 0.07
  p += (wktsLeft - 5) * 0.05
  p -= Math.max(0, reqRR - 9) * 0.04
  if (ballsLeft <= 12 && need > ballsLeft * 2) p -= 0.25
  const chasing = clamp(p, 0.03, 0.97)

  // Map the chasing side to one of the two teams.
  const innName = cur.inning.toLowerCase()
  const chasingIsTeam0 = innName.includes(data.teams[0].toLowerCase().split(' ')[0])
  const t0 = chasingIsTeam0 ? chasing : 1 - chasing
  const pct0 = Math.round(t0 * 100)
  return { pct0, pct1: 100 - pct0 }
}
