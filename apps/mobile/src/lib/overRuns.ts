import type { BbbBall } from '../types/extras'

export interface OverRuns {
  over: number
  runs: number
  wickets: number
}

export function runsPerOver(bbb: BbbBall[]): OverRuns[] {
  const map = new Map<number, { runs: number; wickets: number }>()
  for (const b of bbb) {
    const over = b.overNum ?? 0
    if (!over) continue
    const row = map.get(over) ?? { runs: 0, wickets: 0 }
    row.runs += b.runs ?? 0
    const ev = (b.event ?? '').toLowerCase()
    if (ev.includes('wicket') || ev.includes('wkt')) row.wickets++
    map.set(over, row)
  }
  return [...map.entries()]
    .sort((a, b) => a[0] - b[0])
    .map(([over, v]) => ({ over, runs: v.runs, wickets: v.wickets }))
}
