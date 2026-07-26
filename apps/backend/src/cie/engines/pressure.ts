import type { IntelligenceModule, MatchState, PressureLevel, PressureResult } from '../types'
import { CIE_WEIGHTS } from '../weights'

function level(score: number): PressureLevel {
  if (score >= 85) return 'EXTREME'
  if (score >= 65) return 'HIGH'
  if (score >= 40) return 'MEDIUM'
  return 'LOW'
}

export const pressureEngine: IntelligenceModule<PressureResult> = {
  calculate(state: MatchState): PressureResult {
    const w = CIE_WEIGHTS.pressure
    const reasons: string[] = []
    let score = 20

    if (state.target != null && state.ballsLeft > 0) {
      const gap = state.requiredRR - state.currentRR
      if (gap > 0) {
        score += Math.min(40, gap * w.rrrGap)
        reasons.push(`Required RR ${state.requiredRR.toFixed(1)} vs current ${state.currentRR.toFixed(1)}`)
        if (state.ballsLeft <= 36) {
          score += w.oversLeftTight
          reasons.push('Overs running out')
        }
      } else {
        score -= Math.min(20, Math.abs(gap) * 6)
        reasons.push('Batting ahead of required rate')
        // Balls left only tighten pressure when the chase is still tight on wickets/rate
        if (state.ballsLeft <= 18 && state.wicketsInHand <= 4) {
          score += Math.round(w.oversLeftTight * 0.5)
          reasons.push('Finish line near with few wickets left')
        }
      }
    } else {
      // 1st innings: pressure on batting to set / bowling to contain
      if (state.wickets >= 3) {
        score += state.wickets * (w.wicketsLost * 0.7)
        reasons.push(`${state.wickets} wickets down`)
      }
      if (state.phase === 'DEATH' && state.currentRR < 9) {
        score += 15
        reasons.push('Death overs, scoring under par')
      }
    }

    score += state.wickets * (w.wicketsLost * 0.5)
    const dots = state.last30Balls.filter((b) => b.isDot).length
    const n = Math.max(1, state.last30Balls.length)
    const dotPct = (dots / n) * 100
    if (dotPct >= 40) {
      score += (dotPct - 35) * w.dotPct
      reasons.push(`Dot balls ${Math.round(dotPct)}% in last 30`)
    }

    const recentWkts = state.last30Balls.filter((b) => b.isWicket).length
    if (recentWkts > 0) {
      score += recentWkts * w.recentWickets
      reasons.push(`${recentWkts} recent wicket${recentWkts > 1 ? 's' : ''}`)
    }

    if (state.last3OversRuns <= 12 && state.overs >= 3) {
      score += w.last3Slow
      reasons.push(`Only ${state.last3OversRuns} runs in last 3 overs`)
    }

    score = Math.round(Math.max(0, Math.min(100, score)))
    if (!reasons.length) reasons.push('Stable game situation')
    return { score, level: level(score), reasons: reasons.slice(0, 4) }
  },
}
