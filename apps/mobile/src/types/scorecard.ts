export interface BatsmanRow {
  batsman: { id: string; name: string }
  'dismissal-text': string
  r: number
  b: number
  '4s': number
  '6s': number
  sr: number
}

export interface BowlerRow {
  bowler: { id: string; name: string }
  o: number
  m: number
  r: number
  w: number
  eco: number
}

export interface InningScorecard {
  inning: string
  batting: BatsmanRow[]
  bowling: BowlerRow[]
  extras?: { t: number; b: number; lb: number; w: number; nb: number; p: number }
  totals?: { r: number; w: number; o: number }
}

export interface ScorecardData {
  id: string
  name: string
  matchType: string
  status: string
  venue: string
  date: string
  teams: string[]
  teamInfo: { name: string; shortname: string; img: string }[]
  score: { r: number; w: number; o: number; inning: string }[]
  tossWinner?: string
  tossChoice?: string
  scorecard: InningScorecard[]
  matchStarted: boolean
  matchEnded: boolean
}

export interface ScorecardResponse {
  success: boolean
  data: ScorecardData
  error?: string
}
