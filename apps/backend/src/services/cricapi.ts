import axios from 'axios'

const BASE = 'https://api.cricapi.com/v1'
const KEY  = process.env.CRICAPI_KEY!

function checkResponse(data: { status?: string; reason?: string; message?: string }) {
  if (data.status !== 'success') {
    throw new Error(data.reason ?? data.message ?? 'CricAPI error')
  }
}

async function fetchAllMatches() {
  const { data } = await axios.get(`${BASE}/matches`, {
    params: { apikey: KEY, offset: 0 },
  })
  checkResponse(data)
  return data.data as Match[]
}

export async function getLiveMatches() {
  try {
    const { data } = await axios.get(`${BASE}/currentMatches`, {
      params: { apikey: KEY, offset: 0 },
    })
    if (data.status === 'success') return data.data as Match[]
  } catch {
    // currentMatches can fail on free tier — fall back to /matches
  }

  const all = await fetchAllMatches()
  return all.filter((m) => m.matchStarted && !m.matchEnded)
}

export async function getUpcomingMatches() {
  const all = await fetchAllMatches()
  return all.filter((m) => !m.matchStarted && !m.matchEnded)
}

export async function getMatchScore(matchId: string) {
  const { data } = await axios.get(`${BASE}/match_scorecard`, {
    params: { apikey: KEY, id: matchId },
  })
  checkResponse(data)
  return data.data
}

export interface Match {
  id: string
  name: string
  matchType?: string
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
  r: number
  w: number
  o: number
  inning: string
}
