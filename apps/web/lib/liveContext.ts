import type { BbbBall, BowlerRow, BatsmanRow, ScorecardData } from './api'

export function oversToBalls(o: number): number {
  const whole = Math.floor(o)
  return whole * 6 + Math.round((o - whole) * 10)
}

export function oversTotalFor(matchType?: string): number | null {
  const fmt = (matchType ?? '').toLowerCase()
  if (fmt.includes('test')) return null
  if (fmt.includes('odi') || fmt.includes('list a')) return 50
  return 20
}

/** Current RR and required RR (chase only). */
export function matchRunRates(data: ScorecardData): { crr: number | null; rrr: number | null } {
  const active = data.score?.[data.score.length - 1]
  if (!active || active.o < 0.05) return { crr: null, rrr: null }
  const crr = active.r / active.o
  let rrr: number | null = null
  const oversTotal = oversTotalFor(data.matchType)
  if (
    data.matchStarted && !data.matchEnded
    && (data.score?.length ?? 0) >= 2
    && oversTotal != null
  ) {
    const balls = oversToBalls(active.o)
    const target = (data.score![0].r) + 1
    const need = Math.max(0, target - active.r)
    const left = Math.max(0, oversTotal * 6 - balls)
    if (left > 0) rrr = need / (left / 6)
  }
  return { crr, rrr }
}

export function liveBatters(data: ScorecardData): BatsmanRow[] {
  const inn = data.scorecard?.[data.scorecard.length - 1]
  if (!inn?.batting?.length) return []
  const onStrike = inn.batting.filter((b) => (b['dismissal-text'] ?? '').toLowerCase() === 'batting')
  if (onStrike.length) return onStrike.slice(0, 2)
  // Fallback: last two not-out lines
  return inn.batting
    .filter((b) => (b['dismissal-text'] ?? '').toLowerCase().includes('not out'))
    .slice(-2)
}

export function liveBowler(data: ScorecardData, bbb: BbbBall[] = []): BowlerRow | null {
  const inn = data.scorecard?.[data.scorecard.length - 1]
  if (!inn?.bowling?.length) return null
  const lastName = bbb[bbb.length - 1]?.bowler?.trim()
  if (lastName) {
    const key = lastName.toLowerCase().split(/\s+/).pop() ?? lastName.toLowerCase()
    const hit = inn.bowling.find((b) => b.bowler.name.toLowerCase().includes(key))
    if (hit) return hit
  }
  // Prefer bowler mid-over (fractional overs)
  const mid = [...inn.bowling].reverse().find((b) => {
    const frac = b.o - Math.floor(b.o)
    return frac > 0.05 && frac < 0.95
  })
  return mid ?? inn.bowling[inn.bowling.length - 1] ?? null
}

export function shortPlayer(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean)
  if (parts.length <= 1) return name
  return `${parts[0][0]}. ${parts[parts.length - 1]}`
}
