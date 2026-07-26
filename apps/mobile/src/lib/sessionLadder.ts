import type { SessionMarket } from '../types/odds'

export type SessionCheckpoint =
  | { kind: 'over'; at: number; label: string }
  | { kind: 'balls'; at: number; label: string }
  | { kind: 'session'; at: number; label: string }

export function checkpointsForFormat(matchType?: string, matchName?: string): SessionCheckpoint[] {
  const fmt = `${matchType ?? ''} ${matchName ?? ''}`.toLowerCase()
  if (fmt.includes('test')) {
    return [
      { kind: 'session', at: 1, label: '1st Session' },
      { kind: 'session', at: 2, label: '2nd Session' },
      { kind: 'session', at: 3, label: '3rd Session' },
    ]
  }
  if (fmt.includes('odi') || fmt.includes('list a')) {
    return [10, 20, 30, 40, 50].map((o) => ({ kind: 'over' as const, at: o, label: `${o} Over Runs` }))
  }
  if (fmt.includes('hundred') || fmt.includes('100 ball') || /\b100\b/.test(fmt)) {
    return [25, 50, 75, 100].map((b) => ({ kind: 'balls' as const, at: b, label: `${b} Balls Runs` }))
  }
  return [6, 10, 15, 20].map((o) => ({ kind: 'over' as const, at: o, label: `${o} Over Runs` }))
}

function oversToBalls(o: number): number {
  const w = Math.floor(o)
  return w * 6 + Math.round((o - w) * 10)
}

/**
 * Real-time: only the *next* session for current progress.
 * e.g. 2 ov bowled → 6 Over Runs; 12 ov → 15 Over Runs. Never all four at once.
 */
export function buildSessionLadder(opts: {
  matchType?: string
  matchName?: string
  currentOvers?: number
  currentRuns?: number
  ballsFaced?: number
  battingShort?: string
}): SessionMarket[] {
  const overs = opts.currentOvers ?? 0
  const runs = opts.currentRuns ?? 0
  const balls = opts.ballsFaced ?? (overs > 0 ? oversToBalls(overs) : 0)
  const crr = overs > 0.05 ? runs / overs : 8
  const prefix = opts.battingShort ? `${opts.battingShort} ` : ''
  const cps = checkpointsForFormat(opts.matchType, opts.matchName)
  if (!cps.length) return []

  const progressOf = (cp: SessionCheckpoint) => {
    if (cp.kind === 'over') return overs
    if (cp.kind === 'balls') return balls
    return overs / 30
  }

  // First checkpoint not yet reached; else last (innings complete for ladder)
  const next = cps.find((cp) => progressOf(cp) < cp.at - 0.05) ?? cps[cps.length - 1]
  const progress = progressOf(next)
  const settled = progress >= next.at - 0.05

  let line: number
  if (next.kind === 'over') {
    line = settled && overs > 0
      ? Math.round(runs * (next.at / Math.max(overs, next.at)))
      : Math.round(crr * next.at)
  } else if (next.kind === 'balls') {
    const rpb = balls > 0 ? runs / balls : 1.2
    line = settled && balls > 0
      ? Math.round(runs * (next.at / Math.max(balls, next.at)))
      : Math.round(rpb * next.at)
  } else {
    line = Math.round(crr * 30)
  }

  // CG-style dual quote: lower | higher (pink / green boxes)
  const lo = Math.max(1, line)
  return [{
    id: `sess-${next.kind}-${next.at}`,
    name: `${prefix}${next.label}`.trim(),
    line: lo,
    yes: lo,
    no: lo + 1,
    status: settled ? 'settled' : 'open',
    dir: 'same',
  }]
}
