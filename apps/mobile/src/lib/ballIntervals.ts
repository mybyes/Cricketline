import type { BbbBall } from '../types/extras'

export interface BallInterval {
  /** Cumulative legal/delivery count at this checkpoint (5, 10, 15…). */
  afterBalls: number
  /** Runs scored in this chunk only. */
  chunkRuns: number
  /** Wickets in this chunk only. */
  chunkWkts: number
  /** Cumulative score after this checkpoint. */
  totalRuns: number
  /** Cumulative wickets after this checkpoint. */
  totalWkts: number
  battingTeam?: string
}

function isWicket(b: BbbBall): boolean {
  const e = (b.event ?? '').toLowerCase()
  return e === 'w' || e.includes('wicket') || e.includes('out')
}

function ballRuns(b: BbbBall): number {
  return typeof b.runs === 'number' ? b.runs : 0
}

/**
 * Cricket Guru–style history: checkpoints every `every` balls (newest first).
 * Uses sequential BBB order; prefers ballNbr when present.
 */
export function buildBallIntervals(bbb: BbbBall[], every = 5): BallInterval[] {
  if (!bbb.length || every < 1) return []

  const ordered = [...bbb].sort((a, b) => {
    const an = a.ballNbr ?? 0
    const bn = b.ballNbr ?? 0
    if (an !== bn) return an - bn
    return 0
  })

  const out: BallInterval[] = []
  let totalRuns = 0
  let totalWkts = 0
  let chunkRuns = 0
  let chunkWkts = 0
  let n = 0

  for (const b of ordered) {
    n += 1
    const r = ballRuns(b)
    const w = isWicket(b) ? 1 : 0
    totalRuns += r
    totalWkts += w
    chunkRuns += r
    chunkWkts += w

    if (n % every === 0) {
      out.push({
        afterBalls: n,
        chunkRuns,
        chunkWkts,
        totalRuns,
        totalWkts,
        battingTeam: b.batsman ? undefined : undefined,
      })
      chunkRuns = 0
      chunkWkts = 0
    }
  }

  // Partial trailing chunk (e.g. live at 37 balls → show After 37)
  if (n % every !== 0 && n > 0) {
    out.push({
      afterBalls: n,
      chunkRuns,
      chunkWkts,
      totalRuns,
      totalWkts,
    })
  }

  return out.reverse()
}
