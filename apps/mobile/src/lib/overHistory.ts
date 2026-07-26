import type { BbbBall } from '../types/extras'

export interface OverHistoryRow {
  overNum: number
  balls: BbbBall[]
  overRuns: number
  overWkts: number
  totalRuns: number
  totalWkts: number
  afterBalls: number
  bowler?: string
}

/** One ball inside an over, with progressive score (newest-first ready). */
export interface BallHistoryLine {
  ball: BbbBall
  overNum: number
  ballInOver: number
  notation: string
  totalRuns: number
  totalWkts: number
  afterBalls: number
  oversAtBall: number
  timeLabel: string
}

export function overOrdinal(n: number): string {
  const v = n % 100
  const suf = v >= 11 && v <= 13 ? 'th' : ({ 1: 'st', 2: 'nd', 3: 'rd' } as Record<number, string>)[n % 10] ?? 'th'
  return `${n}${suf}`
}

function isWicketBall(b: BbbBall): boolean {
  const e = (b.event ?? '').toLowerCase()
  return e === 'w' || e.includes('wicket') || e.includes('out')
}

function runsOf(b: BbbBall): number {
  return typeof b.runs === 'number' ? b.runs : 0
}

/** Per-ball lines for an over (newest ball first), matching CG History layout. */
export function ballLinesForOver(ov: OverHistoryRow, ballsPerOver = 6): BallHistoryLine[] {
  const startRuns = ov.totalRuns - ov.overRuns
  const startWkts = ov.totalWkts - ov.overWkts
  const startBalls = ov.afterBalls - ov.balls.length
  let runs = startRuns
  let wkts = startWkts
  let after = startBalls
  const chron: BallHistoryLine[] = []
  ov.balls.forEach((ball, i) => {
    runs += runsOf(ball)
    if (isWicketBall(ball)) wkts += 1
    after += 1
    const ballInOver = i + 1
    const completed = ov.overNum - 1
    chron.push({
      ball,
      overNum: ov.overNum,
      ballInOver,
      notation: `${completed}.${Math.min(ballInOver, ballsPerOver)}`,
      totalRuns: runs,
      totalWkts: wkts,
      afterBalls: after,
      oversAtBall: completed + Math.min(ballInOver, ballsPerOver) / 10,
      timeLabel: '',
    })
  })
  // Synthetic clocks (~50s/ball) so History matches sample density
  const now = Date.now()
  chron.forEach((line, i) => {
    const t = new Date(now - (chron.length - 1 - i) * 50_000)
    line.timeLabel = t.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
  })
  return chron.reverse()
}

function isWicket(b: BbbBall): boolean {
  const e = (b.event ?? '').toLowerCase()
  return e === 'w' || e.includes('wicket') || e.includes('out')
}

function ballRuns(b: BbbBall): number {
  return typeof b.runs === 'number' ? b.runs : 0
}

function rowsFromGroups(groups: Map<number, BbbBall[]>): OverHistoryRow[] {
  const keys = [...groups.keys()].sort((a, b) => a - b)
  const out: OverHistoryRow[] = []
  let totalRuns = 0
  let totalWkts = 0
  let afterBalls = 0

  for (const overNum of keys) {
    const balls = groups.get(overNum)!
    let overRuns = 0
    let overWkts = 0
    for (const b of balls) {
      overRuns += ballRuns(b)
      if (isWicket(b)) overWkts += 1
      afterBalls += 1
    }
    totalRuns += overRuns
    totalWkts += overWkts
    out.push({
      overNum,
      balls,
      overRuns,
      overWkts,
      totalRuns,
      totalWkts,
      afterBalls,
      bowler: balls[balls.length - 1]?.bowler,
    })
  }
  return out.reverse()
}

function groupsLookSane(groups: Map<number, BbbBall[]>, ballsPerOver: number): boolean {
  if (groups.size === 0) return false
  const maxAllowed = ballsPerOver + 4
  for (const balls of groups.values()) {
    if (balls.length > maxAllowed) return false
  }
  if (groups.size === 1 && [...groups.values()][0].length > maxAllowed) return false
  return true
}

/** Over-by-over history (newest first). Hardens against broken overNum feeds. */
export function buildOverHistory(bbb: BbbBall[], ballsPerOver = 6): OverHistoryRow[] {
  if (!bbb.length) return []

  const ordered = [...bbb].sort((a, b) => {
    const an = a.ballNbr ?? 0
    const bn = b.ballNbr ?? 0
    if (an !== bn) return an - bn
    return (a.overNum ?? 0) - (b.overNum ?? 0)
  })

  const byOver = new Map<number, BbbBall[]>()
  let anyOver = false
  for (const b of ordered) {
    if (b.overNum != null && b.overNum > 0) {
      anyOver = true
      const k = Math.floor(b.overNum)
      if (!byOver.has(k)) byOver.set(k, [])
      byOver.get(k)!.push(b)
    }
  }
  if (anyOver && groupsLookSane(byOver, ballsPerOver)) {
    return rowsFromGroups(byOver)
  }

  const byNbr = new Map<number, BbbBall[]>()
  const uniqueNbrs = new Set(ordered.map((b) => b.ballNbr).filter((n): n is number => n != null && n > 0))
  if (uniqueNbrs.size >= ordered.length * 0.8) {
    for (const b of ordered) {
      const n = b.ballNbr ?? 0
      const k = Math.floor((Math.max(1, n) - 1) / ballsPerOver) + 1
      if (!byNbr.has(k)) byNbr.set(k, [])
      byNbr.get(k)!.push(b)
    }
    if (groupsLookSane(byNbr, ballsPerOver)) return rowsFromGroups(byNbr)
  }

  const byIdx = new Map<number, BbbBall[]>()
  ordered.forEach((b, i) => {
    const k = Math.floor(i / ballsPerOver) + 1
    if (!byIdx.has(k)) byIdx.set(k, [])
    byIdx.get(k)!.push(b)
  })
  return rowsFromGroups(byIdx)
}
