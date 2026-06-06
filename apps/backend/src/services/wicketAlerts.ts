import type { FastifyBaseLogger } from 'fastify'
import type { Redis } from 'ioredis'
import type { Match } from './cricapi'
import { sendPushNotifications } from './push'
import { getPushTokensForMatch } from './store'

const WICKET_INNINGS_KEY = (id: string) => `wicket:innings:${id}`
const TTL_SEC = 86_400

function inningsWickets(match: Match): number[] {
  return (match.score ?? []).map((s) => s.w ?? 0)
}

function wicketsIncreased(prev: number[], current: number[]): boolean {
  const len = Math.max(prev.length, current.length)
  for (let i = 0; i < len; i++) {
    if ((current[i] ?? 0) > (prev[i] ?? 0)) return true
  }
  return false
}

/** Compare live scorecard wicket counts vs Redis; push to favorited devices when wickets rise. */
export async function processWicketAlerts(
  redis: Redis,
  matches: Match[],
  log: FastifyBaseLogger,
) {
  for (const match of matches) {
    if (!match.matchStarted || match.matchEnded) continue

    const current = inningsWickets(match)
    if (!current.length) continue

    const key = WICKET_INNINGS_KEY(match.id)
    const raw = await redis.get(key)
    const prev = raw ? (JSON.parse(raw) as number[]) : null

    if (prev && wicketsIncreased(prev, current)) {
      const tokens = await getPushTokensForMatch(match.id)
      if (tokens.length) {
        const teams = match.teams.join(' vs ')
        const fallen = current.reduce((s, w, i) => s + Math.max(0, w - (prev[i] ?? 0)), 0)
        await sendPushNotifications(
          tokens,
          `Wicket! ${teams}`,
          `${match.status}${fallen > 1 ? ` · ${fallen} wickets` : ''}`,
          { matchId: match.id },
        )
        log.info({ matchId: match.id, tokens: tokens.length, wickets: current }, 'wicket push sent')
      }
    }

    await redis.setex(key, TTL_SEC, JSON.stringify(current))
  }
}
