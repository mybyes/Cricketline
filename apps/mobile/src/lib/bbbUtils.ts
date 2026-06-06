import type { BbbBall } from '../types/extras'
import { ballSummaryLabel } from './ballColors'

/** Current over number from the latest ball in the feed. */
export function getCurrentOverNum(bbb: BbbBall[]): number | null {
  if (!bbb.length) return null
  const last = bbb[bbb.length - 1]
  if (last.overNum != null) return last.overNum
  const n = last.ballNbr ?? bbb.length
  return Math.ceil(n / 6)
}

/** All balls bowled in the current over (chronological). */
export function getCurrentOverBalls(bbb: BbbBall[]): BbbBall[] {
  const over = getCurrentOverNum(bbb)
  if (over == null) return []
  return bbb.filter((b) => b.overNum === over)
}

/** e.g. "Over 18: 1 . W 4 . 1" */
export function buildOverSummaryLine(bbb: BbbBall[]): string {
  const over = getCurrentOverNum(bbb)
  if (over == null) return ''
  const balls = getCurrentOverBalls(bbb)
  if (!balls.length) return ''
  return `Over ${over}: ${balls.map(ballSummaryLabel).join(' ')}`
}
