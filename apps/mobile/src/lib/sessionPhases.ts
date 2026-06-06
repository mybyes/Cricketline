import type { BbbBall } from '../types/extras'

export interface PhaseStats {
  label: string
  overs: string
  runs: number
  wickets: number
  rr: string | null
}

function isWicket(b: BbbBall) {
  const e = (b.event ?? '').toLowerCase()
  return e === 'w' || e.includes('wicket') || e.includes('out')
}

function phaseFilter(bbb: BbbBall[], from: number, to: number) {
  return bbb.filter((b) => {
    const o = b.overNum ?? 0
    return o >= from && o <= to
  })
}

function statsFor(balls: BbbBall[], label: string, overs: string): PhaseStats {
  const runs = balls.reduce((s, b) => s + (typeof b.runs === 'number' ? b.runs : 0), 0)
  const wickets = balls.filter(isWicket).length
  const overCount = new Set(balls.map((b) => b.overNum)).size || balls.length / 6
  const rr = overCount > 0 ? (runs / Math.max(overCount, 1)).toFixed(2) : null
  return { label, overs, runs, wickets, rr }
}

/** T20/ODI phase breakdown from BBB (powerplay / middle / death). */
export function t20PhaseStats(bbb: BbbBall[], matchType?: string): PhaseStats[] {
  const fmt = matchType?.toLowerCase() ?? 't20'
  if (fmt.includes('test')) return []

  const ppEnd = fmt.includes('odi') ? 10 : 6
  const midEnd = fmt.includes('odi') ? 40 : 15

  const pp = phaseFilter(bbb, 1, ppEnd)
  const mid = phaseFilter(bbb, ppEnd + 1, midEnd)
  const death = phaseFilter(bbb, midEnd + 1, 99)

  return [
    statsFor(pp, 'Powerplay', `1-${ppEnd}`),
    statsFor(mid, 'Middle', `${ppEnd + 1}-${midEnd}`),
    statsFor(death, 'Death', `${midEnd + 1}+`),
  ].filter((p) => p.runs > 0 || p.wickets > 0)
}
