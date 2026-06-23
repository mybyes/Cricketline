import { Redis } from 'ioredis'

/**
 * Fan win-predictor poll — one anonymous vote per device per match, changeable.
 * Stored as a Redis hash (deviceId → '0' | '1'); tallies derived from the hash.
 */
let _redis: Redis | null = null
export function initPollRedis(redis: Redis) { _redis = redis }
function getRedis() {
  if (!_redis) throw new Error('Redis not initialized for poll')
  return _redis
}

const pollKey = (matchId: string) => `poll:${matchId}`

export interface PollResult {
  counts: [number, number]
  total: number
  your: 0 | 1 | null
}

export async function getPoll(matchId: string, deviceId?: string): Promise<PollResult> {
  const all = await getRedis().hgetall(pollKey(matchId))
  let c0 = 0
  let c1 = 0
  for (const v of Object.values(all)) {
    if (v === '0') c0++
    else if (v === '1') c1++
  }
  const your = deviceId && all[deviceId] != null ? (all[deviceId] === '1' ? 1 : 0) : null
  return { counts: [c0, c1], total: c0 + c1, your }
}

export async function vote(matchId: string, deviceId: string, choice: 0 | 1): Promise<PollResult> {
  const key = pollKey(matchId)
  await getRedis().hset(key, deviceId, String(choice))
  // Keep poll data from living forever — refresh a 30-day expiry on each write.
  await getRedis().expire(key, 2_592_000)
  return getPoll(matchId, deviceId)
}
