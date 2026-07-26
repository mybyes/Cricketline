import type { IntelligenceModule, MatchState, MomentumResult } from '../types'
import { CIE_WEIGHTS } from '../weights'

export const momentumEngine: IntelligenceModule<MomentumResult> = {
  calculate(state: MatchState): MomentumResult {
    const w = CIE_WEIGHTS.momentum
    const contributors: string[] = []
    let value = 0

    const last2 = state.last10Overs.slice(-2)
    const last2Runs = last2.reduce((s, o) => s + o.runs, 0)
    value += last2Runs * w.last2OversRuns
    if (last2Runs >= 20) contributors.push(`${last2Runs} runs in last two overs`)
    else if (last2Runs > 0 && last2Runs <= 8) {
      value -= 10
      contributors.push(`Quiet last two overs (${last2Runs} runs)`)
    }

    const boundaries = state.last30Balls.filter((b) => b.isBoundary).length
    value += boundaries * w.boundaryBonus
    if (boundaries >= 4) contributors.push(`${boundaries} boundaries recently`)

    const wkts = state.last30Balls.filter((b) => b.isWicket).length
    value -= wkts * w.wicketPenalty
    if (wkts > 0) contributors.push(`${wkts} wicket${wkts > 1 ? 's' : ''} in last 30 balls`)

    if (state.target != null && state.currentRR > state.requiredRR + 0.5) {
      value += w.rrLift
      contributors.push('Run rate above required')
    } else if (state.target != null && state.requiredRR > state.currentRR + 1.5) {
      value -= w.rrLift
      contributors.push('Falling behind required rate')
    }

    const bigOver = state.last10Overs.slice(-1)[0]
    if (bigOver && bigOver.runs >= 16) {
      value += 10
      contributors.push(`Big over: ${bigOver.runs} runs`)
    }

    value = Math.round(Math.max(-100, Math.min(100, value)))
    const direction = value >= 8 ? 'UP' : value <= -8 ? 'DOWN' : 'FLAT'
    if (!contributors.length) contributors.push('Even contest')

    return {
      team: state.battingTeam,
      value,
      direction,
      contributors: contributors.slice(0, 3),
    }
  },
}
