import type { IntelligenceModule, MatchState, ProjectionResult } from '../types'
import { CIE_WEIGHTS } from '../weights'

export const projectionEngine: IntelligenceModule<ProjectionResult | null> = {
  calculate(state: MatchState): ProjectionResult | null {
    if (state.matchEnded || state.innings >= 2) return null
    if (state.oversTotal > 50) return null // skip tests

    const w = CIE_WEIGHTS.projection
    const oversLeft = Math.max(0, state.oversTotal - state.overs)
    if (oversLeft <= 0) {
      return {
        low: state.score, expected: state.score, high: state.score,
        confidence: 99, reasons: ['Innings complete'],
      }
    }

    let rr = state.currentRR || 7.5
    if (state.phase === 'DEATH') rr *= w.deathBoost
    rr *= 1 - state.wickets * w.wicketDrag
    rr = Math.max(4, Math.min(14, rr))

    const expected = Math.round(state.score + rr * oversLeft)
    const band = Math.max(4, Math.round(expected * w.bandPct + state.wickets * 2))
    const confidence = Math.round(Math.max(55, Math.min(92, 88 - state.wickets * 4 - (oversLeft > 10 ? 8 : 0))))

    const reasons = [
      `Current RR ${state.currentRR.toFixed(1)}`,
      `${oversLeft.toFixed(1)} overs left`,
      state.phase === 'DEATH' ? 'Death-over uplift applied' : `${state.wickets} wickets down`,
    ]

    return {
      low: expected - band,
      expected,
      high: expected + band,
      confidence,
      reasons,
    }
  },
}
