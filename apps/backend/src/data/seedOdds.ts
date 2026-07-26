/**
 * Demo market boards — both teams' match rates + format session ladder.
 * No lay/back pairs, no Fall of Wicket markets.
 */
import type { MatchOddsBoard } from '../types/odds'
import { ODDS_DISCLAIMER } from '../types/odds'
import { buildSessionLadder } from '../lib/sessionLadder'

function board(
  matchId: string,
  matchOdds: MatchOddsBoard['matchOdds'],
  sessions: MatchOddsBoard['sessions'],
): MatchOddsBoard {
  return {
    matchId,
    source: 'seed',
    displayOnly: true,
    disclaimer: ODDS_DISCLAIMER,
    matchOdds,
    sessions,
    updatedAt: Date.now(),
    suspended: false,
  }
}

export const SEED_ODDS: Record<string, MatchOddsBoard> = {
  'seed-live-1': board(
    'seed-live-1',
    [
      { team: 'Royal Challengers Bengaluru', shortname: 'RCB', back: 1.72, dir: 'down' },
      { team: 'Mumbai Indians', shortname: 'MI', back: 1.55, dir: 'up' },
    ],
    // T20 ladder at ~14 ov / 154 runs (MI batting)
    buildSessionLadder({
      matchType: 't20',
      currentOvers: 14,
      currentRuns: 154,
      battingShort: 'MI',
    }),
  ),
  'seed-live-2': board(
    'seed-live-2',
    [
      { team: 'India', shortname: 'IND', back: 1.45, dir: 'same' },
      { team: 'England', shortname: 'ENG', back: 2.85, dir: 'same' },
    ],
    buildSessionLadder({
      matchType: 'test',
      currentOvers: 28,
      currentRuns: 100,
      battingShort: 'IND',
    }),
  ),
  'seed-recent-1': board(
    'seed-recent-1',
    [
      { team: 'Chennai Super Kings', shortname: 'CSK', back: 1.01, dir: 'same' },
      { team: 'Kolkata Knight Riders', shortname: 'KKR', back: 25.0, dir: 'same' },
    ],
    buildSessionLadder({
      matchType: 't20',
      currentOvers: 20,
      currentRuns: 168,
      battingShort: 'CSK',
    }),
  ),
}

export function seedOdds(matchId: string): MatchOddsBoard | null {
  const base = SEED_ODDS[matchId]
  if (!base) return null
  return {
    ...base,
    updatedAt: Date.now(),
    matchOdds: base.matchOdds.map((o) => ({ ...o })),
    sessions: base.sessions.map((s) => ({ ...s })),
  }
}
