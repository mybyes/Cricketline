import test from 'node:test'
import assert from 'node:assert/strict'
import {
  type Match,
  seedMatchList, seedScorecard, isQuotaError, detectWinner,
  buildStandingsFromMatches, buildMatchHistory, scorecardFromMatch,
} from './cricapi'

// ---- Pre-filled fallback selectors ----

test('seedMatchList filters by state (live / upcoming / recent)', () => {
  const live = seedMatchList('live')
  assert.ok(live.length > 0, 'seed has live matches')
  assert.ok(live.every((m) => m.matchStarted && !m.matchEnded), 'live = started, not ended')

  const upcoming = seedMatchList('upcoming')
  assert.ok(upcoming.every((m) => !m.matchStarted && !m.matchEnded), 'upcoming = not started')

  const recent = seedMatchList('recent')
  assert.ok(recent.every((m) => m.matchEnded), 'recent = ended')
})

test('seedScorecard returns a card for a seed id but null for a real id', () => {
  assert.ok(seedScorecard('seed-live-1')?.teams?.length, 'seed id resolves to a card')
  assert.equal(seedScorecard('a1b2c3realmatchid'), null, 'real id must NOT get fake seed data')
})

// ---- Quota detection (key rotation trigger) ----

test('isQuotaError detects hits limit, zero credits, and quota wording', () => {
  assert.equal(isQuotaError({ info: { hitsToday: 100, hitsLimit: 100 } }), true)
  assert.equal(isQuotaError({ info: { credits: 0 } }), true)
  assert.equal(isQuotaError({ reason: 'Too many requests, hits limit reached' }), true)
  assert.equal(isQuotaError({ status: 'success' }), false)
  assert.equal(isQuotaError({ reason: 'Invalid match id' }), false)
})

// ---- Result detection + points table ----

test('detectWinner reads the result from the status line', () => {
  assert.equal(detectWinner({ teams: ['India', 'England'], status: 'India won by 5 wickets' }), 'India')
  assert.equal(detectWinner({ teams: ['India', 'England'], status: 'England won by 20 runs' }), 'England')
  assert.equal(detectWinner({ teams: ['India', 'England'], status: 'Match drawn', score: [] }), null)
})

test('buildStandingsFromMatches awards 2/1/0 and orders by points', () => {
  const m = (teams: string[], status: string) => ({ teams, status, matchEnded: true, score: [] })
  const table = buildStandingsFromMatches([
    m(['Alpha', 'Bravo'], 'Alpha won by 10 runs'),
    m(['Alpha', 'Charlie'], 'Alpha won by 5 wickets'),
    m(['Bravo', 'Charlie'], 'Bravo won by 2 wickets'),
    m(['Bravo', 'Charlie'], 'Match tied'),
  ])
  const row = (t: string) => table.find((r) => r.team === t)!
  assert.equal(table[0].team, 'Alpha', 'leader sorts first')
  assert.equal(row('Alpha').w, 2)
  assert.equal(row('Alpha').pts, 4)
  assert.equal(row('Bravo').w, 1)
  assert.equal(row('Bravo').t, 1)
  assert.equal(row('Bravo').pts, 3) // 2 (win) + 1 (tie)
  assert.equal(row('Charlie').pts, 1) // 0 wins + 1 tie
})

// ---- Head-to-head / recent form ----

test('buildMatchHistory splits H2H from each team’s other recent games', () => {
  const mk = (id: string, teams: string[], ended = true): Match =>
    ({ id, teams, matchEnded: ended, dateTimeGMT: `2026-01-0${id.length}` } as unknown as Match)
  const all = [
    mk('cur', ['India', 'Australia'], false),
    mk('h2h', ['India', 'Australia']),
    mk('indo', ['India', 'England']),
    mk('auso', ['Australia', 'South Africa']),
  ]
  const h = buildMatchHistory('cur', all)
  assert.deepEqual(h.headToHead.map((m) => m.id), ['h2h'])
  assert.ok(h.team1Recent.some((m) => m.id === 'indo'))
  assert.ok(h.team2Recent.some((m) => m.id === 'auso'))
})

// ---- Minimal scorecard projection ----

test('scorecardFromMatch projects score + teams with an empty card', () => {
  const m = { id: 'x', name: 'A vs B', status: 'live', venue: 'V', date: 'd', teams: ['A', 'B'], score: [{ r: 50, w: 1, o: 6, inning: 'A Inning' }], matchStarted: true, matchEnded: false } as unknown as Match
  const sc = scorecardFromMatch(m)
  assert.deepEqual(sc.teams, ['A', 'B'])
  assert.equal(sc.score[0].r, 50)
  assert.deepEqual(sc.scorecard, [])
})
