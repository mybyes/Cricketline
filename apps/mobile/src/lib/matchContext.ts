import type { Match } from '../types/match'
import { formatScore, formatType, teamScores } from '../theme/matchUtils'

export function matchContextLine(match: Match): string | null {
  const live = match.matchStarted && !match.matchEnded
  const fmt = formatType(match)
  const [s0, s1] = teamScores(match)

  if (match.matchEnded) {
    return match.status.length > 80 ? `${fmt} · Result` : `${fmt} · ${match.status}`
  }

  if (!live) return `${fmt} · ${match.date ? 'Upcoming' : 'Scheduled'}`

  const scores = match.score ?? []
  if (!scores.length) return `${fmt} · Live`

  const last = scores[scores.length - 1]
  const lastStr = formatScore(last)
  if (!lastStr) return `${fmt} · Live`

  if (scores.length >= 2 && s0 && s1) {
    const target = s0.r + 1
    const need = target - last.r
    const totalOvers = fmt === 'ODI' ? 50 : fmt === 'TEST' ? 90 : 20
    const ballsLeft = Math.max(0, Math.round((totalOvers - last.o) * 6))
    if (need > 0 && ballsLeft > 0) return `${lastStr} · ${fmt} · Need ${need} off ${ballsLeft}`
    if (need <= 0) return `${lastStr} · ${fmt} · Won`
  }

  return `${lastStr} · ${fmt}`
}
