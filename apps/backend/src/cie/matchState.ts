import type { BallEvent, MatchState, OverBucket, PhaseName } from './types'
import { CIE_WEIGHTS } from './weights'

export function oversToBalls(o: number): number {
  const whole = Math.floor(o)
  return whole * 6 + Math.round((o - whole) * 10)
}

export function ballsToOvers(balls: number): number {
  const w = Math.floor(balls / 6)
  return w + (balls % 6) / 10
}

function clamp(n: number, lo: number, hi: number) {
  return Math.max(lo, Math.min(hi, n))
}

export function oversTotalFor(matchType?: string, matchName?: string): number {
  const fmt = `${matchType ?? ''} ${matchName ?? ''}`.toLowerCase()
  if (fmt.includes('odi') || fmt.includes('list a')) return 50
  if (fmt.includes('test')) return 90 // session-ish; projection limited
  if (fmt.includes('hundred') || fmt.includes('100')) return 20
  return 20
}

export function phaseFor(overs: number, oversTotal: number, matchType?: string): PhaseName {
  const fmt = (matchType ?? '').toLowerCase()
  const cfg = fmt.includes('odi') ? CIE_WEIGHTS.phase.odi : CIE_WEIGHTS.phase.t20
  if (oversTotal <= 0) return 'UNKNOWN'
  if (overs < cfg.powerplayEnd) return 'POWERPLAY'
  if (overs >= cfg.deathStart) return 'DEATH'
  return 'MIDDLE'
}

type ScoreRow = { r: number; w: number; o: number; inning: string }
type BbbLike = {
  runs?: number
  event?: string
  overNum?: number
  ballNbr?: number
}
type ScorecardLike = {
  id: string
  name?: string
  matchType?: string
  teams: string[]
  score?: ScoreRow[]
  matchStarted?: boolean
  matchEnded?: boolean
  scorecard?: {
    inning: string
    totals?: { r: number; w: number; o: number }
    fallOfWickets?: { wkt: number; runs: number; over?: number }[]
    overRuns?: number[]
  }[]
}

function isWicketEvent(e?: string) {
  const s = (e ?? '').toLowerCase()
  return s === 'w' || s.includes('wicket') || s.includes('out')
}

function toBallEvents(bbb: BbbLike[]): BallEvent[] {
  return bbb.map((b) => {
    const runs = typeof b.runs === 'number' ? b.runs : 0
    const wicket = isWicketEvent(b.event)
    return {
      runs,
      isWicket: wicket,
      isBoundary: runs === 4 || runs === 6,
      isDot: runs === 0 && !wicket,
      overNum: b.overNum,
      ballNbr: b.ballNbr,
    }
  })
}

function overBuckets(bbb: BbbLike[], overRuns?: number[]): OverBucket[] {
  if (overRuns?.length) {
    return overRuns.map((runs, i) => ({
      overNum: i + 1,
      runs,
      wickets: 0,
      balls: 6,
    }))
  }
  const map = new Map<number, OverBucket>()
  for (const b of toBallEvents(bbb)) {
    const k = b.overNum != null && b.overNum > 0
      ? Math.floor(b.overNum)
      : b.ballNbr != null
        ? Math.floor((Math.max(1, b.ballNbr) - 1) / 6) + 1
        : 0
    if (k <= 0) continue
    const cur = map.get(k) ?? { overNum: k, runs: 0, wickets: 0, balls: 0 }
    cur.runs += b.runs
    cur.balls += 1
    if (b.isWicket) cur.wickets += 1
    map.set(k, cur)
  }
  return [...map.values()].sort((a, b) => a.overNum - b.overNum)
}

function battingLabel(teams: string[], inning: string): string {
  const hit = teams.find((t) => inning.toLowerCase().includes(t.toLowerCase().split(' ')[0] ?? '___'))
  return hit ?? teams[teams.length > 1 ? 1 : 0] ?? 'Batting'
}

function partnershipFrom(sc: ScorecardLike, score: number, balls: number): { runs: number; balls: number } {
  const inn = sc.scorecard?.[sc.scorecard.length - 1]
  const fow = inn?.fallOfWickets ?? []
  if (!fow.length) return { runs: score, balls }
  const last = fow[fow.length - 1]
  const runs = Math.max(0, score - (last.runs ?? 0))
  const lastBalls = last.over != null ? oversToBalls(last.over) : Math.max(0, balls - 12)
  return { runs, balls: Math.max(1, balls - lastBalls) }
}

/** Build normalized MatchState from scorecard + optional BBB. */
export function buildMatchState(sc: ScorecardLike, bbb: BbbLike[] = []): MatchState | null {
  if (!sc?.teams?.length || !sc.score?.length) return null
  const active = sc.score[sc.score.length - 1]
  const oversTotal = oversTotalFor(sc.matchType, sc.name)
  const balls = oversToBalls(active.o)
  const events = toBallEvents(bbb)
  const last30 = events.slice(-30)
  const overs = overBuckets(bbb, sc.scorecard?.[sc.scorecard.length - 1]?.overRuns)
  const last10 = overs.slice(-10)
  const last3 = last10.slice(-3).reduce((s, o) => s + o.runs, 0)
  const last5 = last10.slice(-5).reduce((s, o) => s + o.runs, 0)

  const battingTeam = battingLabel(sc.teams, active.inning)
  const bowlingTeam = sc.teams.find((t) => t !== battingTeam) ?? sc.teams[0]
  const innings = sc.score.length
  const target = innings >= 2 ? (sc.score[0].r + 1) : undefined
  const ballsLeft = Math.max(0, oversTotal * 6 - balls)
  const runsNeeded = target != null ? Math.max(0, target - active.r) : 0
  const currentRR = active.o > 0.05 ? active.r / active.o : 0
  const requiredRR = ballsLeft > 0 && target != null ? runsNeeded / (ballsLeft / 6) : 0
  const phase = phaseFor(active.o, oversTotal, sc.matchType)
  const part = partnershipFrom(sc, active.r, balls)
  const fingerprint = [
    sc.id,
    active.r,
    active.w,
    active.o,
    bbb.length,
    sc.matchEnded ? 1 : 0,
  ].join(':')

  return {
    matchId: sc.id,
    matchType: sc.matchType ?? 't20',
    matchName: sc.name ?? '',
    teams: [sc.teams[0], sc.teams[1] ?? sc.teams[0]],
    battingTeam,
    bowlingTeam,
    innings,
    score: active.r,
    wickets: active.w,
    overs: active.o,
    balls,
    oversTotal,
    target,
    currentRR: clamp(currentRR, 0, 36),
    requiredRR: clamp(requiredRR, 0, 36),
    wicketsInHand: Math.max(0, 10 - active.w),
    ballsLeft,
    runsNeeded,
    phase,
    last30Balls: last30,
    last10Overs: last10,
    last3OversRuns: last3,
    last5OversRuns: last5,
    partnership: {
      runs: part.runs,
      balls: part.balls,
      strikeRate: part.balls > 0 ? (part.runs / part.balls) * 100 : 0,
    },
    fingerprint,
    matchEnded: !!sc.matchEnded,
    matchStarted: !!sc.matchStarted,
  }
}
