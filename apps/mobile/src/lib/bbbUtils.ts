import type { BbbBall } from '../types/extras'
import { ballSummaryLabel } from './ballColors'

export function getCurrentOverNum(bbb: BbbBall[]): number | null {
  if (!bbb.length) return null
  const last = bbb[bbb.length - 1]
  if (last.overNum != null) return last.overNum
  const n = last.ballNbr ?? bbb.length
  return Math.ceil(n / 6)
}

export function getCurrentOverBalls(bbb: BbbBall[]): BbbBall[] {
  const over = getCurrentOverNum(bbb)
  if (over == null) return []
  return bbb.filter((b) => b.overNum === over)
}

export function buildOverSummaryLine(bbb: BbbBall[]): string {
  const over = getCurrentOverNum(bbb)
  if (over == null) return ''
  const balls = getCurrentOverBalls(bbb)
  if (!balls.length) return ''
  return `Over ${over}: ${balls.map(ballSummaryLabel).join(' ')}`
}

export interface OverGroup {
  overNum: number
  balls: BbbBall[]
}

/** Last N balls grouped by over (newest over first). */
export function groupRecentOvers(bbb: BbbBall[], maxBalls = 30): OverGroup[] {
  const recent = bbb.slice(-maxBalls)
  const map = new Map<number, BbbBall[]>()
  for (const b of recent) {
    const over = b.overNum ?? 0
    if (!map.has(over)) map.set(over, [])
    map.get(over)!.push(b)
  }
  return [...map.entries()]
    .sort((a, b) => b[0] - a[0])
    .map(([overNum, balls]) => ({ overNum, balls }))
}
