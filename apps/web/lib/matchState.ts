import type { Match } from './api'

/** Mirror of backend heuristics — drop finished games from Live UI. */
export function looksCompleted(m: Pick<Match, 'matchEnded' | 'status'>): boolean {
  if (m.matchEnded) return true
  const s = (m.status ?? '').toLowerCase()
  if (!s) return false
  return (
    /\bwon by\b/.test(s)
    || /\bwon the\b/.test(s)
    || /\bmatch tied\b/.test(s)
    || /\bno result\b/.test(s)
    || /\babandoned\b/.test(s)
    || /\bcancel+ed\b/.test(s)
    || /\bwash(ed)?[\s-]?out\b/.test(s)
  )
}

export function isLiveMatch(m: Match): boolean {
  return !!m.matchStarted && !looksCompleted(m)
}
