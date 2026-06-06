import type { Match } from '../types/match'

export function seriesName(match: Match) {
  const parts = match.name.split(',').map((s) => s.trim())
  if (parts.length >= 3) return parts[parts.length - 1]
  if (parts.length === 2) return parts[1]
  return match.matchType?.toUpperCase() ?? 'Cricket'
}

export function formatType(match: Match) {
  const t = match.matchType?.toLowerCase() ?? ''
  if (t.includes('test')) return 'TEST'
  if (t.includes('odi')) return 'ODI'
  if (t.includes('t20')) return 'T20'
  return (match.matchType ?? 'MATCH').toUpperCase()
}

export function teamShort(match: Match, index: number) {
  return match.teamInfo?.[index]?.shortname ?? match.teams[index]?.slice(0, 3).toUpperCase() ?? '—'
}

export function teamLogo(match: Match, index: number) {
  return match.teamInfo?.[index]?.img
}

export function teamScores(match: Match) {
  if (!match.score?.length) return [null, null] as const
  const byTeam = new Map<string, { r: number; w: number; o: number }>()
  for (const s of match.score) {
    const team = s.inning.split(' ')[0].toLowerCase()
    byTeam.set(team, { r: s.r, w: s.w, o: s.o })
  }
  const find = (name: string) => {
    for (const [k, v] of byTeam) if (k.includes(name) || name.includes(k)) return v
    return null
  }
  return [find(match.teams[0]?.toLowerCase() ?? ''), find(match.teams[1]?.toLowerCase() ?? '')] as const
}

export function allInningsScores(match: Match) {
  return match.score ?? []
}

export function formatScore(s: { r: number; w: number; o: number } | null) {
  if (!s) return null
  return `${s.r}-${s.w} (${s.o})`
}

export function formatDate(date: string, gmt?: string) {
  try {
    const d = new Date(gmt || date)
    return d.toLocaleDateString(undefined, {
      weekday: 'short', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit',
    })
  } catch {
    return date
  }
}

/** Safe strike rate — avoids crash when sr is NaN (0 balls faced) */
export function formatSr(sr?: number, balls?: number) {
  if (!balls || !sr || !Number.isFinite(sr)) return '—'
  return sr.toFixed(balls >= 100 ? 0 : 1)
}

export function formatTimeShort(gmt?: string) {
  if (!gmt) return ''
  try {
    return new Date(gmt).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })
  } catch {
    return ''
  }
}
