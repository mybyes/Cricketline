import type { Match } from './api'

const HOME_KEY = 'cricketfast:home:v1'

export type HomeCache = {
  live: Match[]
  recent: Match[]
  upcoming: Match[]
  savedAt: number
}

export function loadHomeCache(): HomeCache | null {
  if (typeof window === 'undefined') return null
  try {
    const raw = localStorage.getItem(HOME_KEY)
    if (!raw) return null
    return JSON.parse(raw) as HomeCache
  } catch {
    return null
  }
}

export function saveHomeCache(live: Match[], recent: Match[], upcoming: Match[]) {
  if (typeof window === 'undefined') return
  const prev = loadHomeCache()
  const payload: HomeCache = {
    live: live.length ? live : (prev?.live ?? []),
    recent: recent.length ? recent : (prev?.recent ?? []),
    upcoming: upcoming.length ? upcoming : (prev?.upcoming ?? []),
    savedAt: Date.now(),
  }
  if (!payload.live.length && !payload.recent.length && !payload.upcoming.length) return
  localStorage.setItem(HOME_KEY, JSON.stringify(payload))
}

export function mergeMatchList(incoming: Match[], previous: Match[]): Match[] {
  if (incoming.length) return incoming
  return previous.length ? previous : incoming
}
