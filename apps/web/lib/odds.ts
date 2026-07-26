/** Shared display-only odds types (mirrors backend MatchOddsBoard). */

export type OddsDirection = 'up' | 'down' | 'same'
export type MarketStatus = 'open' | 'suspended' | 'settled'

export interface TeamOdds {
  team: string
  shortname?: string
  back: number
  lay?: number
  dir: OddsDirection
}

export interface SessionMarket {
  id: string
  name: string
  line: number
  yes?: number
  no?: number
  status: MarketStatus
  dir: OddsDirection
}

export interface MatchOddsBoard {
  matchId: string
  source: 'seed' | 'feed'
  displayOnly: true
  disclaimer: string
  matchOdds: TeamOdds[]
  sessions: SessionMarket[]
  updatedAt: number
  suspended?: boolean
}
