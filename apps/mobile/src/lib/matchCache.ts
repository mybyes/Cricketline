import AsyncStorage from '@react-native-async-storage/async-storage'
import { loadLocalFavorites, savedToMatch } from './favorites'
import type { Match } from '../types/match'
import type { BbbBall } from '../types/extras'
import type { ScorecardData } from '../types/scorecard'

const HOME_KEY = 'cache:home:v2'
const SCORE_PREFIX = 'cache:score:v2:'

export type HomeCache = {
  live: Match[]
  recent: Match[]
  upcoming: Match[]
  savedAt: number
}

export async function saveHomeCache(live: Match[], recent: Match[], upcoming: Match[]) {
  const prev = await loadHomeCache()
  const payload: HomeCache = {
    live: live.length ? live : (prev?.live ?? []),
    recent: recent.length ? recent : (prev?.recent ?? []),
    upcoming: upcoming.length ? upcoming : (prev?.upcoming ?? []),
    savedAt: Date.now(),
  }
  if (!payload.live.length && !payload.recent.length && !payload.upcoming.length) return
  await AsyncStorage.setItem(HOME_KEY, JSON.stringify(payload))
}

export async function loadHomeCache(): Promise<HomeCache | null> {
  try {
    const raw = await AsyncStorage.getItem(HOME_KEY)
    if (!raw) return null
    return JSON.parse(raw) as HomeCache
  } catch {
    return null
  }
}

export async function saveScoreCache(matchId: string, data: ScorecardData, bbb: BbbBall[]) {
  const prev = await loadScoreCache(matchId)
  await AsyncStorage.setItem(`${SCORE_PREFIX}${matchId}`, JSON.stringify({
    data,
    bbb: bbb.length ? bbb : (prev?.bbb ?? []),
    savedAt: Date.now(),
  }))
}

export async function loadScoreCache(matchId: string): Promise<{ data: ScorecardData; bbb: BbbBall[]; savedAt: number } | null> {
  try {
    const raw = await AsyncStorage.getItem(`${SCORE_PREFIX}${matchId}`)
    if (!raw) return null
    return JSON.parse(raw) as { data: ScorecardData; bbb: BbbBall[]; savedAt: number }
  } catch {
    return null
  }
}

/** Empty API responses never replace data we already have */
export function mergeMatchList(incoming: Match[] | undefined, previous: Match[]): Match[] {
  if (incoming?.length) return incoming
  return previous.length ? previous : (incoming ?? [])
}

export async function hydrateHomeFromFavorites(): Promise<{
  live: Match[]
  recent: Match[]
  upcoming: Match[]
}> {
  const favs = await loadLocalFavorites()
  const matches = favs.map(savedToMatch)
  return {
    live: matches.filter((m) => m.matchStarted && !m.matchEnded),
    recent: matches.filter((m) => m.matchEnded),
    upcoming: matches.filter((m) => !m.matchStarted && !m.matchEnded),
  }
}
