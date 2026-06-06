import { FastifyInstance } from 'fastify'
import { getLiveMatches, getUpcomingMatches } from '../services/cricapi'
import { cached, CACHE_KEYS, LIVE_MATCHES_TTL, SCHEDULE_TTL } from '../services/cache'

async function withStaleFallback<T>(
  redis: FastifyInstance['redis'],
  key: string,
  fetch: () => Promise<T>
): Promise<{ data: T; stale?: boolean }> {
  try {
    const data = await fetch()
    return { data }
  } catch (e) {
    const hit = await redis.get(key)
    if (hit) return { data: JSON.parse(hit) as T, stale: true }
    throw e
  }
}

export default async function matchesRoute(app: FastifyInstance) {
  app.get('/matches/live', async (req, reply) => {
    try {
      const { data, stale } = await withStaleFallback(
        app.redis,
        CACHE_KEYS.liveMatches(),
        () => cached(app.redis, CACHE_KEYS.liveMatches(), LIVE_MATCHES_TTL, getLiveMatches)
      )
      return { success: true, data, stale: stale ?? false }
    } catch (e: any) {
      reply.status(500).send({ success: false, error: e.message })
    }
  })

  app.get('/matches/upcoming', async (req, reply) => {
    try {
      const { data, stale } = await withStaleFallback(
        app.redis,
        CACHE_KEYS.schedule(),
        () => cached(app.redis, CACHE_KEYS.schedule(), SCHEDULE_TTL, getUpcomingMatches)
      )
      return { success: true, data, stale: stale ?? false }
    } catch (e: any) {
      reply.status(500).send({ success: false, error: e.message })
    }
  })
}
