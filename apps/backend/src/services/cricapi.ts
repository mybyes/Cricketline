import axios from 'axios'

const BASE = 'https://api.cricapi.com/v1'
const KEY  = process.env.CRICAPI_KEY!

export async function getLiveMatches() {
  const { data } = await axios.get(`${BASE}/currentMatches`, {
    params: { apikey: KEY, offset: 0 }
  })
  if (data.status !== 'success') throw new Error('CricAPI error')
  return data.data as Match[]
}

export async function getMatchScore(matchId: string) {
  const { data } = await axios.get(`${BASE}/match_scorecard`, {
    params: { apikey: KEY, id: matchId }
  })
  return data.data
}

export interface Match {
  id: string
  name: string
  status: string
  venue: string
  date: string
  dateTimeGMT: string
  teams: string[]
  teamInfo: TeamInfo[]
  score: Score[]
  series_id: string
  fantasyEnabled: boolean
  bbbEnabled: boolean
  hasSquad: boolean
  matchStarted: boolean
  matchEnded: boolean
}

interface TeamInfo {
  name: string
  shortname: string
  img: string
}

interface Score {
  r: number   // runs
  w: number   // wickets
  o: number   // overs
  inning: string
}
