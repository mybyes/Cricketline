import type { Redis } from 'ioredis'
import { getLiveMatches, getMatchBbb, getMatchScore } from '../services/cricapi'
import { cached, CACHE_KEYS } from '../services/cache'
import { buildMatchState } from './matchState'
import { aggregateIntelligence } from './aggregator'
import type { MatchIntelligence, MatchIntelligenceCard } from './types'

const INTEL_TTL = 12
const LIVE_INTEL_CAP = 8

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

function toCard(intel: MatchIntelligence): MatchIntelligenceCard {
  return {
    matchId: intel.matchId,
    fingerprint: intel.fingerprint,
    updatedAt: intel.updatedAt,
    headline: intel.narrative.headline,
    winProbability: intel.winProbability,
    pressureLevel: intel.pressure.level,
    momentumDirection: intel.momentum.direction,
  }
}

/** Home Live rail — CIE cards for up to LIVE_INTEL_CAP live matches. */
export async function getLiveIntelligenceCards(redis: Redis): Promise<MatchIntelligenceCard[]> {
  const live = await getLiveMatches(redis)
  const ids = live.slice(0, LIVE_INTEL_CAP).map((m) => m.id)
  const settled = await Promise.allSettled(ids.map((id) => getMatchIntelligence(redis, id)))
  const out: MatchIntelligenceCard[] = []
  for (const r of settled) {
    if (r.status === 'fulfilled' && r.value) out.push(toCard(r.value))
  }
  return out
}
