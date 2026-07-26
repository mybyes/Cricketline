import type { IntelligenceModule, MatchState, TurningPoint } from '../types'
import { CIE_WEIGHTS } from '../weights'
import { chaseEngine } from './chase'

export const turningPointEngine: IntelligenceModule<TurningPoint[]> = {
  calculate(state: MatchState): TurningPoint[] {
    const out: TurningPoint[] = []
    const w = CIE_WEIGHTS.turningPoint
    const balls = state.last30Balls
    if (!balls.length) return out

    // Recent wicket after a meaningful stand
    const lastWicketIdx = [...balls].map((b, i) => (b.isWicket ? i : -1)).filter((i) => i >= 0).pop()
    if (lastWicketIdx != null) {
      const before = balls.slice(0, lastWicketIdx)
      const standProxy = before.reduce((s, b) => s + b.runs, 0)
      const chase = chaseEngine.calculate(state)
      const impact = chase
        ? -Math.min(20, Math.round(8 + state.partnership.runs / 10))
        : -Math.min(15, 6 + state.wickets)

      if (standProxy >= 20 || state.partnership.runs >= w.bigPartnership / 2 || state.wickets > 0) {
        const overLabel = state.overs.toFixed(1)
        out.push({
          eventId: `${state.matchId}:wkt:${state.fingerprint}`,
          overLabel,
          title: 'Wicket — shift in control',
          impact,
          reason: state.partnership.runs >= 30
            ? `Partnership broken after ${state.partnership.runs} runs`
            : 'Wicket increases bowling control',
        })
      }
    }

    const lastOver = state.last10Overs[state.last10Overs.length - 1]
    if (lastOver && lastOver.runs >= w.bigOverRuns) {
      out.push({
        eventId: `${state.matchId}:big:${lastOver.overNum}`,
        overLabel: String(lastOver.overNum),
        title: `Big over — ${lastOver.runs} runs`,
        impact: Math.min(18, Math.round(lastOver.runs * 0.8)),
        reason: 'Scoring surge in a single over',
      })
    }

    if (state.phase === 'POWERPLAY' && state.overs >= 5.5 && state.currentRR >= 10) {
      out.push({
        eventId: `${state.matchId}:pp`,
        overLabel: state.overs.toFixed(1),
        title: 'Powerplay dominance',
        impact: 10,
        reason: `Powerplay RR ${state.currentRR.toFixed(1)} well above par`,
      })
    }

    // Dedupe by title, keep strongest |impact|
    const byTitle = new Map<string, TurningPoint>()
    for (const tp of out) {
      const prev = byTitle.get(tp.title)
      if (!prev || Math.abs(tp.impact) > Math.abs(prev.impact)) byTitle.set(tp.title, tp)
    }
    return [...byTitle.values()].slice(0, 3)
  },
}
