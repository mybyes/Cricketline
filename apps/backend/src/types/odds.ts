/**
 * Display-only market board — informational rates for an info app.
 * Never includes wagering, stakes, wallets, or bet placement.
 */

export type OddsDirection = 'up' | 'down' | 'same'
export type MarketStatus = 'open' | 'suspended' | 'settled'

export interface TeamOdds {
  team: string
  shortname?: string
  /** Decimal match odds (back). */
  back: number
  /** Optional lay price when the feed provides exchange-style rates. */
  lay?: number
  dir: OddsDirection
}

export interface SessionMarket {
  id: string
  /** e.g. "MI 6 Over Runs", "1st Innings Runs" */
  name: string
  /** Session / fancy line (runs). */
  line: number
  yes?: number
  no?: number
  status: MarketStatus
  dir: OddsDirection
}

export interface MatchOddsBoard {
  matchId: string
  source: 'seed' | 'feed'
  /** Always true — this product never places bets. */
  displayOnly: true
  disclaimer: string
  matchOdds: TeamOdds[]
  sessions: SessionMarket[]
  updatedAt: number
  suspended?: boolean
}

export const ODDS_DISCLAIMER =
  'Display-only market rates for information. Not a betting service — no wagers accepted.'
