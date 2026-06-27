import type { BbbBall } from '../types/extras'

export interface BallColor {
  bg: string
  text: string
  label: string
}

/** Cricline-style: W=red, 6=purple, 4=orange, dot=dark grey, 1-3=blue */
export function ballColor(b: BbbBall): BallColor {
  const e = b.event?.toLowerCase() ?? ''
  const runs = typeof b.runs === 'number' ? b.runs : parseInt(String(b.runs ?? ''), 10)

  if (e === 'w' || e === 'wicket' || e.includes('wicket') || e.includes('out')) {
    return { bg: '#e53935', text: '#fff', label: 'W' }
  }
  if (runs === 6) return { bg: '#7b1fa2', text: '#fff', label: '6' }
  if (runs === 4) return { bg: '#f57f17', text: '#fff', label: '4' }
  if (runs === 0) return { bg: '#424242', text: '#fff', label: '·' }

  const label = Number.isFinite(runs) ? String(runs) : (b.event ?? '·')
  return { bg: '#1565c0', text: '#fff', label }
}

export function ballSummaryLabel(b: BbbBall): string {
  const e = (b.event ?? '').toLowerCase()
  if (e === 'w' || e === 'wicket' || e.includes('wicket')) return 'W'
  if (b.runs === 0) return '.'
  if (b.runs != null && Number.isFinite(b.runs)) return String(b.runs)
  return b.event ?? '·'
}

/** Narrated outcome for one ball — "FOUR — to the boundary", "OUT! wicket falls", etc. */
export function narrateBall(b: BbbBall): { headline?: string; text: string } {
  const e = b.event?.toLowerCase() ?? ''
  const r = typeof b.runs === 'number' ? b.runs : -1
  if (e === 'w' || e === 'wicket' || e.includes('wicket') || e.includes('out')) {
    return { headline: 'OUT!', text: 'wicket falls' }
  }
  if (r === 6) return { headline: 'SIX', text: 'goes the distance' }
  if (r === 4) return { headline: 'FOUR', text: 'to the boundary' }
  if (r === 0) return { text: 'no run' }
  if (r === 1) return { text: '1 run' }
  if (r > 1) return { text: `${r} runs` }
  return { text: b.event ?? 'dot ball' }
}

/** "Bowler to Batsman" prefix when the feed provides names. */
export function ballActors(b: BbbBall): string {
  if (b.bowler && b.batsman) return `${b.bowler} to ${b.batsman}`
  return ''
}
