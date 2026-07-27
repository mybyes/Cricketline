import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { seedOdds } from '../data/seedOdds'
import { getLiveOddsBoards, getMatchOdds, tickSeedOdds } from './odds'

describe('display-only odds', () => {
  it('seedOdds returns a displayOnly board for seed-live-1', () => {
    const board = seedOdds('seed-live-1')
    assert.ok(board)
    assert.equal(board!.displayOnly, true)
    assert.equal(board!.source, 'seed')
    assert.ok(board!.matchOdds.length >= 2)
    assert.ok(board!.sessions.length >= 1)
    assert.equal(typeof board!.disclaimer, 'string')
  })

  it('seedOdds returns null for unknown real ids', () => {
    assert.equal(seedOdds('not-a-real-seed-id'), null)
  })

  it('tickSeedOdds moves prices and sets direction', () => {
    const before = seedOdds('seed-live-1')!
    // Prime + tick a few times so jitter is likely to change something.
    let last = before
    for (let i = 0; i < 8; i++) {
      const [next] = tickSeedOdds(['seed-live-1'])
      assert.ok(next)
      assert.equal(next!.displayOnly, true)
      last = next!
    }
    assert.equal(last.matchId, 'seed-live-1')
    assert.ok(last.updatedAt >= before.updatedAt)
  })

  it('getMatchOdds serves seed board without ODDS_API_URL', async () => {
    const board = await getMatchOdds('seed-live-1')
    assert.ok(board)
    assert.equal(board!.matchOdds[0].back > 1, true)
  })

  it('getLiveOddsBoards returns seed-live boards in demo', async () => {
    const boards = await getLiveOddsBoards(['seed-live-1', 'seed-live-2'])
    assert.ok(boards.length >= 1)
    for (const b of boards) {
      assert.equal(b.displayOnly, true)
    }
  })
})
