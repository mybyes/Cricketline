import AsyncStorage from '@react-native-async-storage/async-storage'
import type { Match } from '../types/match'
import { addFavoriteRemote, getFavoritesRemote, removeFavoriteRemote } from './api'
import { getDeviceId } from './device'

const LOCAL_KEY = 'cricketfast:favorites'

export interface SavedMatch {
  id: string
  name: string
  teams: string[]
  venue: string
  date: string
  dateTimeGMT?: string
  matchType?: string
  status: string
  teamInfo?: Match['teamInfo']
  score?: Match['score']
  series_id?: string
  matchStarted: boolean
  matchEnded: boolean
}

function toSaved(match: Match): SavedMatch {
  return {
    id: match.id,
    name: match.teams.join(' vs '),
    teams: match.teams,
    venue: match.venue,
    date: match.date,
    dateTimeGMT: match.dateTimeGMT,
    matchType: match.matchType,
    status: match.status,
    teamInfo: match.teamInfo,
    score: match.score,
    series_id: match.series_id,
    matchStarted: match.matchStarted,
    matchEnded: match.matchEnded,
  }
}

export async function loadLocalFavorites(): Promise<SavedMatch[]> {
  const raw = await AsyncStorage.getItem(LOCAL_KEY)
  if (!raw) return []
  return JSON.parse(raw) as SavedMatch[]
}

async function saveLocalFavorites(list: SavedMatch[]) {
  await AsyncStorage.setItem(LOCAL_KEY, JSON.stringify(list))
}

export async function isFavorite(matchId: string): Promise<boolean> {
  const list = await loadLocalFavorites()
  return list.some((m) => m.id === matchId)
}

export async function toggleFavorite(match: Match): Promise<boolean> {
  const list = await loadLocalFavorites()
  const exists = list.some((m) => m.id === match.id)
  const deviceId = await getDeviceId()

  if (exists) {
    const next = list.filter((m) => m.id !== match.id)
    await saveLocalFavorites(next)
    await removeFavoriteRemote(deviceId, match.id).catch(() => {})
    return false
  }

  const saved = toSaved(match)
  await saveLocalFavorites([saved, ...list])
  await addFavoriteRemote(deviceId, match.id, saved.name, saved as unknown as Record<string, unknown>).catch(() => {})
  return true
}

export async function syncFavoritesFromServer(): Promise<SavedMatch[]> {
  const deviceId = await getDeviceId()
  try {
    const res = await getFavoritesRemote(deviceId)
    if (!res.success || !res.data?.length) return loadLocalFavorites()
    const merged = res.data.map((f) => ({
      id: f.match_id,
      name: f.match_name,
      ...(f.match_data as Omit<SavedMatch, 'id' | 'name'>),
    })) as SavedMatch[]
    await saveLocalFavorites(merged)
    return merged
  } catch {
    return loadLocalFavorites()
  }
}

export function savedToMatch(s: SavedMatch): Match {
  return {
    id: s.id,
    name: s.name,
    teams: s.teams,
    teamInfo: s.teamInfo ?? [],
    venue: s.venue,
    date: s.date,
    dateTimeGMT: s.dateTimeGMT ?? s.date,
    matchType: s.matchType,
    status: s.status,
    score: s.score ?? [],
    series_id: s.series_id,
    matchStarted: s.matchStarted,
    matchEnded: s.matchEnded,
  }
}
