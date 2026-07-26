import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { eventToBoard, teamsFuzzyMatch, type OddsEvent } from './theOddsApi'

describe('theOddsApi matching', () => {
  it('fuzzy-matches abbreviated / full team names', () => {
    assert.equal(teamsFuzzyMatch('Manchester Super Giants', 'Manchester Super Giants'), true)
    assert.equal(teamsFuzzyMatch('Birmingham Phoenix', 'Birmingham Phoenix'), true)
    assert.equal(teamsFuzzyMatch('MSG', 'Manchester Super Giants'), true)
    assert.equal(teamsFuzzyMatch('MI', 'Mumbai Indians'), true)
    assert.equal(teamsFuzzyMatch('West Indies', 'Pakistan'), false)
  })

  it('maps h2h event to display-only board without lay', () => {
    const ev: OddsEvent = {
      id: 'e1',
      sport_key: 'cricket_the_hundred',
      sport_title: 'The Hundred',
      commence_time: '2026-07-26T13:00:00Z',
      home_team: 'Manchester Super Giants',
      away_team: 'Birmingham Phoenix',
      bookmakers: [{
        key: 'unibet',
        title: 'Unibet',
        markets: [{
          key: 'h2h',
          outcomes: [
            { name: 'Manchester Super Giants', price: 1.04 },
            { name: 'Birmingham Phoenix', price: 10.5 },
          ],
        }],
      }],
    }
    const board = eventToBoard(ev, 'cric-match-1', ['Manchester Super Giants', 'Birmingham Phoenix'])
    assert.ok(board)
    assert.equal(board!.source, 'feed')
    assert.equal(board!.displayOnly, true)
    assert.equal(board!.matchOdds.length, 2)
    assert.equal(board!.matchOdds[0].back, 1.04)
    assert.equal(board!.matchOdds[0].lay, undefined)
  })
})
