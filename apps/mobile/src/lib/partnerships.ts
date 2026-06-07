import type { BbbBall } from '../types/extras'
import type { InningScorecard } from '../types/scorecard'

export interface PartnershipRow {
  batsmen: string
  runs: number
  balls: number
  ended: string
}

function isWicketBall(b: BbbBall): boolean {
  const ev = (b.event ?? '').toLowerCase()
  return ev.includes('wicket') || ev.includes('wkt') || ev.includes('bowled') || ev.includes('caught')
}

/** Partnership runs between wickets from ball-by-ball data */
export function partnershipsFromBbb(bbb: BbbBall[]): PartnershipRow[] {
  const rows: PartnershipRow[] = []
  let runs = 0
  let balls = 0
  let batters = ''

  for (const b of bbb) {
    runs += b.runs ?? 0
    balls++
    if (b.batsman && b.bowler) batters = `${b.batsman} · ${b.bowler}`

    if (isWicketBall(b)) {
      rows.push({
        batsmen: b.batsman ?? (batters || '—'),
        runs,
        balls,
        ended: b.event ?? 'Wicket',
      })
      runs = 0
      balls = 0
      batters = ''
    }
  }

  if (runs > 0) {
    rows.push({ batsmen: 'At crease', runs, balls, ended: 'batting' })
  }
  return rows
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
