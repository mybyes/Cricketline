import type { Match } from './match'

export interface BbbBall {
  ballNbr?: number
  overNum?: number
  innings?: number
  event?: string
  runs?: number
  batsman?: string
  bowler?: string
}

export interface SquadPlayer {
  player: { id: string; name: string }
  role?: string
  substitute?: boolean
}

export interface SquadTeam {
  team: string
  players: SquadPlayer[]
}

export interface MatchHistoryData {
  teams: string[]
  headToHead: Match[]
  team1Recent: Match[]
  team2Recent: Match[]
}

export interface StandingRow {
  team: string
  m: number
  w: number
  l: number
  t: number
  nr: number
  pts: number
}

export interface SeriesTableData {
  seriesName: string
  standings: StandingRow[]
  matches: { id: string; name: string; status: string; teams: string[] }[]
}

export interface SeriesItem {
  id: string
  name: string
  startDate?: string
  endDate?: string
}
