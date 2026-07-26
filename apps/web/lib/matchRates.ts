import type { MatchOddsBoard, SessionMarket, TeamOdds } from '@/lib/odds'
import { buildSessionLadder } from '@/lib/sessionLadder'
import type { BbbBall, ScorecardData } from '@/lib/api'

export function formatMatchRate(back: number): string {
  if (!Number.isFinite(back) || back <= 0) return '—'
  if (back < 40) return back.toFixed(2)
  return String(Math.round(back))
}

export function toRate(back: number): number {
  if (!Number.isFinite(back) || back <= 0) return 0
  if (back < 40) return Math.round(back * 100) / 100
  return Math.max(40, Math.min(200, Math.round(back)))
}

export function sessionRate(s: SessionMarket): number {
  if (s.line > 0) return Math.round(s.line)
  if (s.yes != null && s.yes > 0) return Math.round(s.yes)
  return 0
}

/** CG dual boxes: [lower pink, higher green]. */
export function sessionPair(s: SessionMarket): [number, number] {
  const lo = Math.round(s.yes ?? s.line ?? 0)
  const hi = Math.round(s.no ?? (lo > 0 ? lo + 1 : 0))
  return [lo, hi > lo ? hi : lo > 0 ? lo + 1 : 0]
}

/** Match-rate dual quote (CG-style adjacent boxes). */
export function matchRatePair(back: number, lay?: number): [string, string] {
  if (!Number.isFinite(back) || back <= 0) return ['—', '—']
  if (back < 40) {
    const a = back.toFixed(2)
    const b = lay != null && lay > back ? lay.toFixed(2) : (back + 0.01).toFixed(2)
    return [a, b]
  }
  const n = Math.round(back)
  return [String(n), String(n + 1)]
}

/**
 * History / CG band: Indian-style integers (38|39).
 * Converts decimal bookmaker odds via 100/back when needed.
 */
export function cgMatchPair(back: number, lay?: number): [string, string] {
  if (!Number.isFinite(back) || back <= 0) return ['—', '—']
  if (back >= 20) {
    const n = Math.round(back)
    const hi = lay != null && lay > n ? Math.round(lay) : n + 1
    return [String(n), String(hi)]
  }
  const n = Math.max(20, Math.min(180, Math.round(100 / back)))
  return [String(n), String(n + 1)]
}

/** "Galle 15 Over Runs" → "15 Over" for compact History rows. */
export function shortSessionLabel(name: string): string {
  return name
    .replace(/\s*Runs?\s*$/i, '')
    .replace(/^[A-Za-z]{2,5}\s+(?=\d)/, '')
    .trim() || name
}

function isFow(name: string) {
  const n = name.toLowerCase()
  return n.includes('fall of') || n.includes('wicket')
}

export function sessionList(board: MatchOddsBoard | null): SessionMarket[] {
  if (!board?.sessions?.length) return []
  return board.sessions.filter((s) => !isFow(s.name))
}

export function activeSession(board: MatchOddsBoard | null): SessionMarket | null {
  const list = sessionList(board)
  return list.find((s) => s.status === 'open') ?? list[0] ?? null
}

export function primaryTeam(board: MatchOddsBoard | null): TeamOdds | null {
  return board?.matchOdds?.[0] ?? null
}

export function rateAtBall(base: number, afterBalls: number): number {
  const wobble = ((afterBalls * 3) % 11) - 5
  if (base < 40) return Math.max(1.01, Math.round((base + wobble * 0.02) * 100) / 100)
  return Math.max(40, Math.min(200, base + wobble))
}

/** Fallback board when feed odds are missing — enough for History dual boxes. */
export function synthRatesBoard(data: ScorecardData, bbb: BbbBall[] = []): MatchOddsBoard {
  const active = data.score?.[data.score.length - 1]
  const balls = bbb.length || Math.round((active?.o ?? 0) * 6)
  const runs = active?.r ?? 0
  const wkts = active?.w ?? 0
  const overs = active?.o ?? 0
  const batShort = data.teamInfo?.[0]?.shortname
    || data.teams[0]?.split(' ').map((w) => w[0]).join('').slice(0, 3).toUpperCase()
    || 'T1'
  const bowlShort = data.teamInfo?.[1]?.shortname
    || data.teams[1]?.split(' ').map((w) => w[0]).join('').slice(0, 3).toUpperCase()
    || 'T2'
  const innName = data.scorecard?.[data.scorecard.length - 1]?.inning ?? ''
  const battingShort =
    data.teamInfo?.find((t) => innName.toLowerCase().includes((t.name ?? '').toLowerCase().split(' ')[0] ?? '___'))?.shortname
    ?? batShort
  // Indian-style band so History matches CG samples (not decimal bookmaker)
  const batRate = Math.max(28, Math.min(90, Math.round(55 - runs * 0.04 - wkts * 2 + (balls % 7))))
  const bowlRate = Math.max(28, Math.min(90, 100 - batRate + 5))

  return {
    matchId: data.id,
    source: 'seed',
    displayOnly: true,
    disclaimer: 'Display-only rates — simulated from live score. Not a betting service.',
    matchOdds: [
      { team: data.teams[0], shortname: batShort, back: batRate, dir: 'same' },
      { team: data.teams[1], shortname: bowlShort, back: bowlRate, dir: 'same' },
    ],
    sessions: buildSessionLadder({
      matchType: data.matchType,
      matchName: data.name,
      currentOvers: overs,
      currentRuns: runs,
      ballsFaced: balls,
      battingShort,
    }),
    updatedAt: Date.now(),
  }
}

export function withSessionLadder(
  board: MatchOddsBoard,
  data: ScorecardData,
  bbb: BbbBall[] = [],
): MatchOddsBoard {
  const active = data.score?.[data.score.length - 1]
  const balls = bbb.length || (active ? Math.round(active.o * 6) : 0)
  const innName = data.scorecard?.[data.scorecard.length - 1]?.inning ?? ''
  const battingShort =
    data.teamInfo?.find((t) => innName.toLowerCase().includes((t.name ?? '').toLowerCase().split(' ')[0] ?? '___'))?.shortname
    ?? data.teamInfo?.[0]?.shortname

  return {
    ...board,
    sessions: buildSessionLadder({
      matchType: data.matchType,
      matchName: data.name,
      currentOvers: active?.o ?? 0,
      currentRuns: active?.r ?? 0,
      ballsFaced: balls,
      battingShort,
    }),
  }
}
