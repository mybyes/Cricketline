import type { Redis } from 'ioredis'
import { getMatchBbb, getMatchScore } from '../services/cricapi'
import { cached, CACHE_KEYS } from '../services/cache'
import { buildMatchState } from './matchState'
import { aggregateIntelligence } from './aggregator'
import type { MatchIntelligence } from './types'

const INTEL_TTL = 12

export async function getMatchIntelligence(
  redis: Redis,
  matchId: string,
): Promise<MatchIntelligence | null> {
  const scoreKey = CACHE_KEYS.scorecard(matchId)
  const bbbKey = CACHE_KEYS.bbb(matchId)

  const [scoreRes, bbbRes] = await Promise.all([
    cached(redis, scoreKey, 12, () => getMatchScore(matchId)),
    cached(redis, bbbKey, 12, () => getMatchBbb(matchId)).catch(() => ({ data: [] as unknown[], cachedAt: Date.now() })),
  ])

  const sc = scoreRes.data as Parameters<typeof buildMatchState>[0]
  const bbb = Array.isArray(bbbRes.data) ? bbbRes.data : []
  const state = buildMatchState(sc, bbb as Parameters<typeof buildMatchState>[1])
  if (!state) return null

  const intelKey = CACHE_KEYS.intelligence(matchId)
  const cachedRaw = await redis.get(intelKey)
  if (cachedRaw) {
    try {
      const prev = JSON.parse(cachedRaw) as MatchIntelligence
      if (prev.fingerprint === state.fingerprint) return prev
    } catch { /* recompute */ }
  }

  const intel = aggregateIntelligence(state)
  await redis.set(intelKey, JSON.stringify(intel), 'EX', INTEL_TTL)
  return intel
}
