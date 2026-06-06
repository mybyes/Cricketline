import type { ScorecardData } from '../types/scorecard'
import { chaseTarget, liveRates } from './matchStats'

export function winProbability(data: ScorecardData): number | null {
  if (!data.matchStarted || data.matchEnded) return null
  const rates = liveRates(data)
  if (!rates || rates.target == null) return null

  const runsNeeded = rates.target - rates.runs
  const wicketsLeft = 10 - rates.wickets
  const fmt = data.matchType?.toLowerCase() ?? 't20'
  const totalOvers = fmt.includes('odi') ? 50 : fmt.includes('test') ? 90 : 20
  const oversLeft = Math.max(0, totalOvers - rates.overs)
  const ballsLeft = oversLeft * 6

  if (runsNeeded <= 0) return 100
  if (ballsLeft <= 0 || wicketsLeft <= 0) return 5

  const resources = ballsLeft * wicketsLeft
  const difficulty = runsNeeded * 8
  const pct = Math.min(95, Math.max(5, (resources / difficulty) * 100))
  return Math.round(pct)
}
