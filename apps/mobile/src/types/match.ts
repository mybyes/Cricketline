export interface Match {
  id: string
  name: string
  status: string
  venue: string
  date: string
  dateTimeGMT: string
  teams: string[]
  teamInfo: { name: string; shortname: string; img: string }[]
  score?: { r: number; w: number; o: number; inning: string }[]
  matchStarted: boolean
  matchEnded: boolean
}

export interface LiveMatchesResponse {
  success: boolean
  data: Match[]
  error?: string
}
