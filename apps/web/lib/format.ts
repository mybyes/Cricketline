import type { Match } from './api'

export function formatScore(s?: { r: number; w: number; o: number } | null) {
  if (!s) return 'Yet to bat'
  return `${s.r}-${s.w} (${s.o})`
}

export function teamScore(match: Match, index: number) {
  if (!match.score?.length) return null
  const team = match.teams[index]?.toLowerCase().split(' ')[0] ?? ''
  return match.score.find((s) => s.inning.toLowerCase().includes(team)) ?? null
}

export function seriesLabel(match: Match) {
  const parts = match.name.split(',').map((s) => s.trim())
  return parts.length >= 2 ? parts[parts.length - 1] : match.matchType?.toUpperCase() ?? 'Cricket'
}

export function formatTime(gmt: string) {
  try {
    return new Date(gmt).toLocaleString('en-IN', {
      weekday: 'short', day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit',
    })
  } catch {
    return gmt
  }
}

export function matchFormat(match: Match) {
  return (match.matchType ?? 'match').toUpperCase()
}
