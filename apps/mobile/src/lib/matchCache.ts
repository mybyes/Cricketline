import AsyncStorage from '@react-native-async-storage/async-storage'
import { loadLocalFavorites, savedToMatch } from './favorites'
import type { Match } from '../types/match'
import type { BbbBall } from '../types/extras'
import type { ScorecardData } from '../types/scorecard'

const HOME_KEY = 'cache:home:v1'
const SCORE_PREFIX = 'cache:score:v1:'

export type HomeCache = {
  live: Match[]
  recent: Match[]
  upcoming: Match[]
  savedAt: number
}

export async function saveHomeCache(live: Match[], recent: Match[], upcoming: Match[]) {
  const payload: HomeCache = { live, recent, upcoming, savedAt: Date.now() }
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
  await AsyncStorage.setItem(`${SCORE_PREFIX}${matchId}`, JSON.stringify({ data, bbb, savedAt: Date.now() }))
}

export async function loadScoreCache(matchId: string): Promise<{ data: ScorecardData; bbb: BbbBall[] } | null> {
  try {
    const raw = await AsyncStorage.getItem(`${SCORE_PREFIX}${matchId}`)
    if (!raw) return null
    const parsed = JSON.parse(raw) as { data: ScorecardData; bbb: BbbBall[] }
    return parsed
  } catch {
    return null
  }
}

export function isBlockedError(err?: string): boolean {
  const lower = (err ?? '').toLowerCase()
  return lower.includes('block') || (lower.includes('15') && lower.includes('min'))
}

/** Saved favorites as a last-resort home feed when API is down */
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

export function friendlyLimitMessage(err?: string): string {
  if (!err) return 'Showing last saved scores — live feed temporarily limited'
  const lower = err.toLowerCase()
  if (lower.includes('15') && (lower.includes('min') || lower.includes('minute'))) {
    return 'CricAPI rate limit — showing last saved scores for ~15 min'
  }
  if (lower.includes('rate') || lower.includes('limit') || lower.includes('429')) {
    return 'Rate limited — showing last saved scores'
  }
  return err
}
