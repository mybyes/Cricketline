import { FastifyInstance } from 'fastify'
import { validateIdParam } from '../lib/validateId'
import { CACHE_KEYS, ODDS_TTL, readCache } from '../services/cache'
import { getLiveMatches } from '../services/cricapi'
import { getLiveOddsBoards, getMatchOdds, oddsFeedConfigured } from '../services/odds'
import { seedOdds } from '../data/seedOdds'
import type { MatchOddsBoard } from '../types/odds'

export default async function oddsRoute(app: FastifyInstance) {
  /** Single-match display-only market board. */
  app.get<{ Params: { id: string } }>(
    '/match/:id/odds',
    { preHandler: validateIdParam },
    async (req, reply) => {
      const { id } = req.params
      const key = CACHE_KEYS.odds(id)

      try {
        const board = await getMatchOdds(id)
        if (board) {
          // Short-lived cache only — do NOT use shared `cached()` (its backoff is for CricAPI).
          await app.redis.setex(key, ODDS_TTL, JSON.stringify({ v: board, at: Date.now() })).catch(() => {})
          return { success: true, data: board, stale: false }
        }
      } catch (e) {
        app.log.warn({ err: e, matchId: id }, 'odds fetch failed')
      }

      const hit = await readCache<MatchOddsBoard>(app.redis, key)
      if (hit?.data) {
        return { success: true, data: hit.data, stale: true, cachedAt: hit.cachedAt }
      }

      const seed = seedOdds(id)
      if (seed) {
        return { success: true, data: seed, stale: true }
      }

      reply.status(404).send({
        success: false,
        error: oddsFeedConfigured()
          ? 'Odds not available for this match (no bookmaker line matched)'
          : 'Odds not available — set THE_ODDS_API_KEY (the-odds-api.com) or ODDS_API_URL',
      })
    },
  )

  /** All live match boards (for home multi-match line / SSE snapshot). */
  app.get('/odds/live', async () => {
    const live = await getLiveMatches(app.redis)
    const ids = live.map((m) => m.id)
    const boards = await getLiveOddsBoards(
      ids,
      live.map((m) => ({ id: m.id, teams: m.teams ?? [] })),
    )
    return { success: true, data: boards, displayOnly: true as const }
  })
}
