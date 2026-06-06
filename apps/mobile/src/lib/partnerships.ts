import type { InningScorecard } from '../types/scorecard'

export interface PartnershipRow {
  batsmen: string
  runs: number
  balls: number
  ended: string
}

export function currentPartnership(inning: InningScorecard): PartnershipRow | null {
  const active = inning.batting.filter((b) => b['dismissal-text'] === 'batting')
  if (active.length < 2) return active.length === 1
    ? { batsmen: active[0].batsman.name, runs: active[0].r, balls: active[0].b, ended: 'batting' }
    : null
  const runs = active[0].r + active[1].r
  const balls = active[0].b + active[1].b
  return {
    batsmen: `${active[0].batsman.name} & ${active[1].batsman.name}`,
    runs,
    balls,
    ended: 'batting',
  }
}

export function partnershipHistory(inning: InningScorecard): PartnershipRow[] {
  const out = inning.batting.filter(
    (b) => b['dismissal-text'] !== 'batting' && !b['dismissal-text'].toLowerCase().includes('not out'),
  )
  return out.map((b) => ({
    batsmen: b.batsman.name,
    runs: b.r,
    balls: b.b,
    ended: b['dismissal-text'],
  }))
}

export function fallOfWickets(inning: InningScorecard): { n: number; player: string; score: string; dismissal: string }[] {
  let cum = 0
  return inning.batting
    .filter((b) => b['dismissal-text'] !== 'batting' && !b['dismissal-text'].toLowerCase().includes('not out'))
    .map((b, i) => {
      cum += b.r
      return {
        n: i + 1,
        player: b.batsman.name,
        score: `${cum}/${i + 1}`,
        dismissal: b['dismissal-text'],
      }
    })
}
