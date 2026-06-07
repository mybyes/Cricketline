export interface Match {
  id: string
  name: string
  matchType?: string
  status: string
  venue: string
  date: string
  dateTimeGMT: string
  teams: string[]
  teamInfo: { name: string; shortname: string; img: string }[]
  score?: { r: number; w: number; o: number; inning: string }[]
  series_id?: string
  matchStarted: boolean
  matchEnded: boolean
}

export type RootStackParamList = {
  Home: undefined
  Scoreboard: { matchId: string; matchName: string; seriesId?: string; matchType?: string }
}

export type RootTabParamList = {
  Live: undefined
  Upcoming: undefined
  Favorites: undefined
  Settings: undefined
}

export interface LiveMatchesResponse {
  success: boolean
  data: Match[]
  error?: string
  stale?: boolean
  cachedAt?: number
}
