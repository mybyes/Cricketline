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
  List: undefined
  MoreHome: undefined
  Favorites: undefined
  Scoreboard: { matchId: string; matchName: string; seriesId?: string; matchType?: string }
  SeriesTable: { seriesId: string; seriesName?: string }
}

export type RootTabParamList = {
  Home: undefined
  Matches: undefined
  Series: undefined
  More: undefined
}

export interface LiveMatchesResponse {
  success: boolean
  data: Match[]
  error?: string
  stale?: boolean
  cachedAt?: number
}
