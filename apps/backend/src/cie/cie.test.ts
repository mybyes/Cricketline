import test from 'node:test'
import assert from 'node:assert/strict'
import { buildMatchState } from './matchState'
import { aggregateIntelligence } from './aggregator'
import { pressureEngine } from './engines/pressure'
import { SEED_SCORECARDS } from '../data/seed'

test('buildMatchState from seed-live-1 chase', () => {
  const sc = SEED_SCORECARDS['seed-live-1']
  assert.ok(sc)
  const state = buildMatchState(sc, [])
  assert.ok(state)
  assert.equal(state!.innings, 2)
  assert.ok(state!.target != null)
  assert.equal(state!.phase, 'MIDDLE')
  assert.ok(state!.requiredRR > 0)
})

test('aggregateIntelligence returns pressure, momentum, chase for live chase', () => {
  const sc = SEED_SCORECARDS['seed-live-1']
  const state = buildMatchState(sc!, [])!
  const intel = aggregateIntelligence(state)
  assert.ok(intel.pressure.score >= 0 && intel.pressure.score <= 100)
  assert.ok(['LOW', 'MEDIUM', 'HIGH', 'EXTREME'].includes(intel.pressure.level))
  assert.ok(intel.momentum.contributors.length)
  assert.ok(intel.chase)
  assert.ok(intel.winProbability)
  assert.ok(intel.narrative.headline.length > 0)
  assert.match(intel.narrative.headline, /Mumbai/i)
  assert.ok(!intel.narrative.summary.includes('  '))
  assert.equal(intel.projection, null) // 2nd innings
})

test('narrative uses team voice when chase is comfortable', () => {
  const sc = SEED_SCORECARDS['seed-live-1']
  const state = buildMatchState(sc!, [])!
  const intel = aggregateIntelligence(state)
  assert.ok(intel.chase && intel.chase.battingWinPct >= 65)
  assert.match(intel.narrative.headline, /ahead|chase/i)
  assert.ok(!/batting side/i.test(intel.narrative.headline))
})

test('pressure rises when RRR >> CRR', () => {
  const sc = SEED_SCORECARDS['seed-live-1']
  const state = buildMatchState(sc!, [])!
  // Force a steep chase
  const steep = {
    ...state,
    currentRR: 6,
    requiredRR: 14,
    ballsLeft: 24,
    runsNeeded: 56,
    wickets: 6,
    wicketsInHand: 4,
    last30Balls: Array.from({ length: 18 }, () => ({
      runs: 0, isWicket: false, isBoundary: false, isDot: true,
    })),
  }
  const p = pressureEngine.calculate(steep)
  assert.ok(p.score >= 65, `expected high pressure, got ${p.score}`)
})

test('first innings gets projection band', () => {
  const sc = {
    ...SEED_SCORECARDS['seed-live-1']!,
    score: [SEED_SCORECARDS['seed-live-1']!.score![0]],
    scorecard: [SEED_SCORECARDS['seed-live-1']!.scorecard![0]],
  }
  const state = buildMatchState(sc, [])!
  const intel = aggregateIntelligence(state)
  assert.ok(intel.projection)
  assert.ok(intel.projection!.high >= intel.projection!.expected)
  assert.ok(intel.projection!.expected >= intel.projection!.low)
})
