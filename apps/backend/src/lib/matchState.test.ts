import test from 'node:test'
import assert from 'node:assert/strict'
import { isLiveMatch, looksCompleted, livePriority, sortLiveMatches } from './matchState'

test('looksCompleted reads result status even when matchEnded is false', () => {
  assert.equal(looksCompleted({ matchEnded: false, status: 'India won by 5 wickets' }), true)
  assert.equal(looksCompleted({ matchEnded: false, status: 'Match tied' }), true)
  assert.equal(looksCompleted({ matchEnded: false, status: 'No result' }), true)
  assert.equal(looksCompleted({ matchEnded: false, status: 'India need 42 runs' }), false)
})

test('isLiveMatch requires started and not completed', () => {
  assert.equal(isLiveMatch({ matchStarted: true, matchEnded: false, status: 'Day 2' }), true)
  assert.equal(isLiveMatch({ matchStarted: true, matchEnded: false, status: 'MI won by 6 runs' }), false)
  assert.equal(isLiveMatch({ matchStarted: false, matchEnded: false, status: '' }), false)
})

test('sortLiveMatches prefers marquee live over random domestic', () => {
  const sorted = sortLiveMatches([
    { matchStarted: true, matchEnded: false, name: 'Club A vs Club B', matchType: 't20', score: [{ r: 10, w: 0, o: 2, inning: 'A' }] },
    { matchStarted: true, matchEnded: false, name: 'India vs Australia, 2nd T20I', matchType: 't20', teams: ['India', 'Australia'], score: [{ r: 120, w: 3, o: 14, inning: 'India' }] },
  ])
  assert.match(sorted[0].name ?? '', /India/)
  assert.ok(livePriority(sorted[0]) > livePriority(sorted[1]))
})
