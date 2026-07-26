import type { IntelligenceModule, MatchState, PhaseResult } from '../types'
import { CIE_WEIGHTS } from '../weights'

export const phaseEngine: IntelligenceModule<PhaseResult> = {
  calculate(state: MatchState): PhaseResult {
    const fmt = state.matchType.toLowerCase()
    const cfg = fmt.includes('odi') ? CIE_WEIGHTS.phase.odi : CIE_WEIGHTS.phase.t20
    const current = state.phase
    const expectedRR = current === 'UNKNOWN' ? 8 : cfg.expected[current]
    const actualRR = state.currentRR
    const diff = actualRR - expectedRR

    let status = 'On par'
    if (diff >= 1.5) status = 'Excellent start'
    else if (diff >= 0.5) status = 'Ahead of par'
    else if (diff <= -1.5) status = 'Behind the rate'
    else if (diff <= -0.5) status = 'Slightly under'

    if (current === 'DEATH' && diff >= 1) status = 'Accelerating'
    if (current === 'MIDDLE' && state.wickets >= 4 && diff < 0) status = 'Rebuild phase'

    return {
      current,
      expectedRR,
      actualRR: Math.round(actualRR * 10) / 10,
      status,
      reasons: [
        `${current.replace('_', ' ')} overs`,
        `Expected RR ${expectedRR} · Actual ${actualRR.toFixed(1)}`,
      ],
    }
  },
}
