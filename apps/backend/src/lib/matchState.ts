/** Shared live/result heuristics — CricAPI `currentMatches` often includes finished games. */

export interface MatchLike {
  matchStarted?: boolean
  matchEnded?: boolean
  status?: string
  name?: string
  matchType?: string
  teams?: string[]
  score?: { r: number; w: number; o: number; inning: string }[]
  dateTimeGMT?: string
}

/** Status text says the match is over even when matchEnded is still false. */
export function looksCompleted(m: MatchLike): boolean {
  if (m.matchEnded) return true
  const s = (m.status ?? '').toLowerCase()
  if (!s) return false
  return (
    /\bwon by\b/.test(s)
    || /\bwon the\b/.test(s)
    || /\bmatch tied\b/.test(s)
    || /\btie\b/.test(s) && /\bsuper over\b/.test(s)
    || /\bno result\b/.test(s)
    || /\babandoned\b/.test(s)
    || /\bcancel+ed\b/.test(s)
    || /\bwash(ed)?[\s-]?out\b/.test(s)
    || /\b(d\/l|dls)\b.*\bwon\b/.test(s)
  )
}

export function isLiveMatch(m: MatchLike): boolean {
  return !!m.matchStarted && !looksCompleted(m)
}

/** Higher = show first in Live / Match of the Day. */
export function livePriority(m: MatchLike): number {
  let score = 0
  const blob = `${m.name ?? ''} ${(m.teams ?? []).join(' ')}`.toLowerCase()
  const fmt = (m.matchType ?? '').toLowerCase()

  if (/\b(world cup|champions trophy|wtc|ashes|asia cup)\b/.test(blob)) score += 120
  if (/\b(ipl|bbl|psl|sa20|il t20|the hundred)\b/.test(blob)) score += 90
  if (/\b(india|australia|england|pakistan|south africa|new zealand|sri lanka|bangladesh|afghanistan|west indies)\b/.test(blob)) {
    score += 70
  }
  if (fmt === 't20' || fmt.includes('t20')) score += 15
  else if (fmt === 'odi') score += 10
  else if (fmt === 'test') score += 8

  score += (m.score?.length ?? 0) * 6
  const last = m.score?.[m.score.length - 1]
  if (last && Number.isFinite(last.o)) score += Math.min(40, last.o)

  // Prefer matches that started more recently among equals (fresher slate)
  const t = m.dateTimeGMT ? Date.parse(m.dateTimeGMT) : 0
  if (Number.isFinite(t) && t > 0) score += Math.min(20, t / 1e12)

  return score
}

export function sortLiveMatches<T extends MatchLike>(matches: T[]): T[] {
  return [...matches].sort((a, b) => livePriority(b) - livePriority(a))
}
