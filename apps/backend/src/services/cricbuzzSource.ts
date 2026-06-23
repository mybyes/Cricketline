import axios from 'axios'
import type { Match } from './cricapi'

/**
 * Secondary data source: the unofficial Cricbuzz API on RapidAPI
 * (host `cricbuzz-cricket.p.rapidapi.com`). Activates only when RAPIDAPI_KEY is set.
 * Used as a fallback when the primary (CricAPI) is empty/over quota.
 *
 * NOTE: built to the provider's documented response shape — verify/adjust the
 * mapper once a real RAPIDAPI_KEY is configured (the nested shape can drift).
 */
const RAPIDAPI_KEY = process.env.RAPIDAPI_KEY
const HOST = process.env.RAPIDAPI_CRICBUZZ_HOST ?? 'cricbuzz-cricket.p.rapidapi.com'

export const CRICBUZZ_ENABLED = !!RAPIDAPI_KEY

interface CbTeam { teamName?: string; teamSName?: string }
interface CbInnings { runs?: number; wickets?: number; overs?: number }
interface CbTeamScore { inngs1?: CbInnings; inngs2?: CbInnings }
interface CbMatchInfo {
  matchId?: number | string
  seriesId?: number | string
  seriesName?: string
  matchDesc?: string
  matchFormat?: string
  startDate?: string | number
  state?: string
  status?: string
  team1?: CbTeam
  team2?: CbTeam
  venueInfo?: { ground?: string; city?: string }
}
interface CbMatch { matchInfo?: CbMatchInfo; matchScore?: { team1Score?: CbTeamScore; team2Score?: CbTeamScore } }
interface CbResponse {
  typeMatches?: { seriesMatches?: { seriesAdWrapper?: { matches?: CbMatch[] } }[] }[]
}

function flattenScore(teamName: string, ts?: CbTeamScore): Match['score'] {
  const out: Match['score'] = []
  const add = (inn?: CbInnings, n?: number) => {
    if (inn && (inn.runs != null || inn.wickets != null)) {
      out.push({ r: inn.runs ?? 0, w: inn.wickets ?? 0, o: inn.overs ?? 0, inning: `${teamName} Inning${n ? ' ' + n : ''}` })
    }
  }
  add(ts?.inngs1, ts?.inngs2 ? 1 : undefined)
  add(ts?.inngs2, 2)
  return out
}

function mapMatch(m: CbMatch, bucket: 'live' | 'recent' | 'upcoming'): Match | null {
  const info = m.matchInfo
  if (!info || !info.team1?.teamName || !info.team2?.teamName) return null
  const t1 = info.team1.teamName
  const t2 = info.team2.teamName
  const start = info.startDate ? new Date(Number(info.startDate)) : new Date()
  const score = [
    ...flattenScore(t1, m.matchScore?.team1Score),
    ...flattenScore(t2, m.matchScore?.team2Score),
  ]
  return {
    id: String(info.matchId ?? ''),
    name: `${t1} vs ${t2}${info.matchDesc ? ', ' + info.matchDesc : ''}${info.seriesName ? ', ' + info.seriesName : ''}`,
    matchType: (info.matchFormat ?? 'match').toLowerCase(),
    status: info.status ?? info.state ?? '',
    venue: [info.venueInfo?.ground, info.venueInfo?.city].filter(Boolean).join(', '),
    date: start.toISOString().slice(0, 10),
    dateTimeGMT: start.toISOString(),
    teams: [t1, t2],
    teamInfo: [
      { name: t1, shortname: info.team1.teamSName ?? '', img: '' },
      { name: t2, shortname: info.team2.teamSName ?? '', img: '' },
    ],
    score,
    series_id: String(info.seriesId ?? ''),
    fantasyEnabled: false,
    bbbEnabled: false,
    hasSquad: false,
    matchStarted: bucket !== 'upcoming',
    matchEnded: bucket === 'recent',
  }
}

async function fetchBucket(bucket: 'live' | 'recent' | 'upcoming'): Promise<Match[]> {
  const { data } = await axios.get<CbResponse>(`https://${HOST}/matches/v1/${bucket}`, {
    headers: { 'X-RapidAPI-Key': RAPIDAPI_KEY!, 'X-RapidAPI-Host': HOST },
    timeout: 10_000,
  })
  const matches: Match[] = []
  for (const tm of data.typeMatches ?? []) {
    for (const sm of tm.seriesMatches ?? []) {
      for (const cb of sm.seriesAdWrapper?.matches ?? []) {
        const mapped = mapMatch(cb, bucket)
        if (mapped?.id) matches.push(mapped)
      }
    }
  }
  return matches
}

/** Fetch live + recent + upcoming from Cricbuzz and merge into one match list. */
export async function fetchCricbuzzMatches(): Promise<Match[]> {
  if (!CRICBUZZ_ENABLED) throw new Error('Cricbuzz source not configured')
  const buckets = await Promise.allSettled([fetchBucket('live'), fetchBucket('recent'), fetchBucket('upcoming')])
  const all: Match[] = []
  const seen = new Set<string>()
  for (const r of buckets) {
    if (r.status !== 'fulfilled') continue
    for (const m of r.value) {
      if (seen.has(m.id)) continue
      seen.add(m.id)
      all.push(m)
    }
  }
  if (!all.length) throw new Error('Cricbuzz returned no matches')
  return all
}
