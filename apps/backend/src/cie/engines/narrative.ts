import type { IntelligenceModule, MatchState, NarrativeResult } from '../types'
import { pressureEngine } from './pressure'
import { momentumEngine } from './momentum'
import { chaseEngine } from './chase'
import { phaseEngine } from './phase'

function shortName(team: string) {
  const parts = team.trim().split(/\s+/).filter(Boolean)
  if (parts.length <= 1) return team
  // Prefer last word for franchise ("Mumbai Indians" → "Mumbai") when 2 words; else initials-friendly first
  if (parts.length === 2) return parts[0]
  return parts.slice(0, 2).join(' ')
}

function joinSentence(...parts: (string | undefined | null)[]) {
  return parts
    .filter((p): p is string => !!p && p.trim().length > 0)
    .map((p) => p.replace(/\.+$/, '').trim())
    .join('. ') + '.'
}

export const narrativeEngine: IntelligenceModule<NarrativeResult> = {
  calculate(state: MatchState): NarrativeResult {
    const pressure = pressureEngine.calculate(state)
    const momentum = momentumEngine.calculate(state)
    const chase = chaseEngine.calculate(state)
    const phase = phaseEngine.calculate(state)
    const bat = shortName(state.battingTeam)
    const bowl = shortName(state.bowlingTeam)
    const tags: string[] = [phase.current, pressure.level]

    let headline = `${bat} and ${bowl} evenly poised`
    let summary = `${state.battingTeam} ${state.score}/${state.wickets} (${state.overs})`

    if (state.matchEnded) {
      return {
        headline: 'Match finished',
        summary: state.matchName || summary,
        tags: ['RESULT'],
      }
    }

    if (chase && chase.difficulty === 'EASY' && chase.battingWinPct >= 65) {
      headline = `${bat} well ahead in the chase`
      summary = joinSentence(
        `${chase.battingWinPct}% lean to ${bat}`,
        chase.reasons[0],
        momentum.contributors[0],
      )
      tags.push('CHASE')
    } else if (chase && (chase.difficulty === 'HARD' || chase.difficulty === 'EXTREME')) {
      headline = `${bat} under pressure in the chase`
      summary = joinSentence(
        `Win lean ${chase.battingWinPct}%`,
        chase.reasons[0],
        pressure.reasons[0],
      )
      tags.push('CHASE')
    } else if (momentum.direction === 'UP' && pressure.level === 'LOW') {
      headline = `${bat} dictating the tempo`
      summary = joinSentence(
        momentum.contributors[0] ?? `${bat} scoring freely`,
        `Pressure stays ${pressure.level.toLowerCase()}`,
      )
    } else if (momentum.direction === 'DOWN' && (pressure.level === 'HIGH' || pressure.level === 'EXTREME')) {
      headline = `${bowl} have seized control`
      summary = joinSentence(
        pressure.reasons[0] ?? 'Pressure rising',
        `Momentum with ${bowl}`,
      )
    } else if (state.wickets >= 5 && state.phase !== 'DEATH') {
      headline = `${bat} middle order under examination`
      summary = joinSentence(
        `${state.wickets} down`,
        `Rebuild needed in the ${phase.current.toLowerCase()}`,
      )
      tags.push('REBUILD')
    } else if (chase && chase.difficulty === 'MEDIUM') {
      headline = `${bat} in a contesting chase`
      summary = joinSentence(
        `${chase.battingWinPct}% lean · ${chase.reasons[0]}`,
        momentum.contributors[0],
      )
      tags.push('CHASE')
    } else if (phase.status.includes('Excellent') || phase.status.includes('Ahead')) {
      headline = `${bat} ${phase.status.toLowerCase()}`
      summary = joinSentence(phase.reasons[0], phase.reasons[1], momentum.contributors[0])
    } else {
      headline = `${bat} — ${phase.current.charAt(0)}${phase.current.slice(1).toLowerCase()}, ${phase.status.toLowerCase()}`
      summary = joinSentence(momentum.contributors[0], pressure.reasons[0], summary)
    }

    if (momentum.direction === 'UP') tags.push('MOMENTUM_UP')
    if (momentum.direction === 'DOWN') tags.push('MOMENTUM_DOWN')

    return { headline, summary, tags }
  },
}
