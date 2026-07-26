import type { ChaseResult, IntelligenceModule, MatchState } from '../types'
import { CIE_WEIGHTS } from '../weights'

function clamp(n: number, lo: number, hi: number) {
  return Math.max(lo, Math.min(hi, n))
}

export const chaseEngine: IntelligenceModule<ChaseResult | null> = {
  calculate(state: MatchState): ChaseResult | null {
    if (state.target == null || state.ballsLeft <= 0) return null
    if (state.runsNeeded <= 0) {
      return {
        battingWinPct: 97,
        bowlingWinPct: 3,
        difficulty: 'EASY',
        reasons: ['Target already reached or matched'],
      }
    }

    const w = CIE_WEIGHTS.chase
    let p = 0.5
    p += (state.currentRR - state.requiredRR) * w.rrGap
    p += (state.wicketsInHand - 5) * w.wicketFactor
    p -= Math.max(0, state.requiredRR - 9) * w.highRrrPenalty
    if (state.ballsLeft <= 12 && state.runsNeeded > state.ballsLeft * 1.8) p -= w.deathPanic
    if (state.partnership.runs >= 40 && state.wicketsInHand >= 6) p += 0.06

    const batting = clamp(p, 0.03, 0.97)
    const battingWinPct = Math.round(batting * 100)
    const bowlingWinPct = 100 - battingWinPct

    let difficulty: ChaseResult['difficulty'] = 'MEDIUM'
    if (battingWinPct >= 70) difficulty = 'EASY'
    else if (battingWinPct >= 45) difficulty = 'MEDIUM'
    else if (battingWinPct >= 25) difficulty = 'HARD'
    else difficulty = 'EXTREME'

    const reasons = [
      `Need ${state.runsNeeded} off ${state.ballsLeft} balls`,
      `RRR ${state.requiredRR.toFixed(1)} · CRR ${state.currentRR.toFixed(1)}`,
      `${state.wicketsInHand} wickets in hand`,
    ]

    return { battingWinPct, bowlingWinPct, difficulty, reasons }
  },
}
