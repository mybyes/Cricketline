import type { MatchIntelligence, MatchState } from './types'
import { pressureEngine } from './engines/pressure'
import { momentumEngine } from './engines/momentum'
import { projectionEngine } from './engines/projection'
import { chaseEngine } from './engines/chase'
import { partnershipEngine } from './engines/partnership'
import { phaseEngine } from './engines/phase'
import { turningPointEngine } from './engines/turningPoint'
import { narrativeEngine } from './engines/narrative'

export function aggregateIntelligence(state: MatchState): MatchIntelligence {
  const chase = chaseEngine.calculate(state)
  const pressure = pressureEngine.calculate(state)
  const momentum = momentumEngine.calculate(state)
  const projection = projectionEngine.calculate(state)
  const partnership = partnershipEngine.calculate(state)
  const phase = phaseEngine.calculate(state)
  const turningPoints = turningPointEngine.calculate(state)
  const narrative = narrativeEngine.calculate(state)

  let winProbability: MatchIntelligence['winProbability'] = null
  if (chase) {
    winProbability = {
      battingPct: chase.battingWinPct,
      bowlingPct: chase.bowlingWinPct,
      leader: chase.battingWinPct >= 50 ? state.battingTeam : state.bowlingTeam,
    }
  } else if (!state.matchEnded && state.innings === 1) {
    // First innings lean from momentum / wickets (soft)
    const lean = Math.round(50 + momentum.value * 0.35 - state.wickets * 3)
    const battingPct = Math.max(20, Math.min(80, lean))
    winProbability = {
      battingPct,
      bowlingPct: 100 - battingPct,
      leader: battingPct >= 50 ? state.battingTeam : state.bowlingTeam,
    }
  }

  return {
    matchId: state.matchId,
    fingerprint: state.fingerprint,
    updatedAt: Date.now(),
    winProbability,
    pressure,
    momentum,
    projection,
    chase,
    phase,
    partnership,
    turningPoints,
    narrative,
  }
}
