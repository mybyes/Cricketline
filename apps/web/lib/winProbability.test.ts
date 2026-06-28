import test from 'node:test'
import assert from 'node:assert/strict'
import type { ScorecardData } from './api'
import { oversToBalls, winProbability } from './winProbability'

// Build a 2nd-innings chase situation. team0 (chasing) batting now.
function chase(opts: { setTotal: number; chaseRuns: number; chaseWkts: number; chaseOvers: number; fmt?: string }): ScorecardData {
  return {
    matchType: opts.fmt ?? 't20',
    teams: ['Chasers', 'Setters'],
    scorecard: [
      { inning: 'Setters Inning', totals: { r: opts.setTotal, w: 10, o: 20 } },
      { inning: 'Chasers Inning', totals: { r: opts.chaseRuns, w: opts.chaseWkts, o: opts.chaseOvers } },
    ],
  } as unknown as ScorecardData
}

test('oversToBalls converts cricket over notation (19.3 = 117 balls)', () => {
  assert.equal(oversToBalls(0), 0)
  assert.equal(oversToBalls(10), 60)
  assert.equal(oversToBalls(19.3), 117)
  assert.equal(oversToBalls(15.5), 95)
})

test('comfortable chase favours the chasing side', () => {
  // need 12 off 48 balls, 8 wickets in hand
  const wp = winProbability(chase({ setTotal: 159, chaseRuns: 148, chaseWkts: 2, chaseOvers: 12 }))
  assert.ok(wp, 'is a valid chase')
  assert.ok(wp!.pct0 > 60, `chasers should be ahead, got ${wp!.pct0}%`)
  assert.equal(wp!.pct0 + wp!.pct1, 100, 'probabilities sum to 100')
})

test('near-impossible chase favours the bowling side', () => {
  // need 60 off the last over (6 balls), 6 down
  const wp = winProbability(chase({ setTotal: 200, chaseRuns: 141, chaseWkts: 6, chaseOvers: 19 }))
  assert.ok(wp)
  assert.ok(wp!.pct0 < 20, `chasers should be well behind, got ${wp!.pct0}%`)
})

test('probabilities stay within the clamped [3,97] band', () => {
  const wp = winProbability(chase({ setTotal: 300, chaseRuns: 5, chaseWkts: 9, chaseOvers: 19 }))
  assert.ok(wp && wp.pct0 >= 3 && wp.pct0 <= 97)
})

test('returns null when it is not a defined limited-overs chase', () => {
  // first innings only
  assert.equal(winProbability({ matchType: 't20', teams: ['A', 'B'], scorecard: [{ inning: 'A Inning', totals: { r: 80, w: 2, o: 10 } }] } as unknown as ScorecardData), null)
  // a Test match (no fixed overs)
  assert.equal(winProbability(chase({ setTotal: 150, chaseRuns: 100, chaseWkts: 3, chaseOvers: 30, fmt: 'test' })), null)
  // target already passed
  assert.equal(winProbability(chase({ setTotal: 150, chaseRuns: 151, chaseWkts: 3, chaseOvers: 18 })), null)
})
