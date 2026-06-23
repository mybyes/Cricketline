import { FastifyInstance } from 'fastify'
import { getAllMatchesCached, getSeriesList } from '../services/cricapi'
import type { Match } from '../services/cricapi'

export interface SearchResults {
  query: string
  matches: Match[]
  teams: { name: string; short: string }[]
  series: { id: string; name: string }[]
}

export default async function searchRoute(app: FastifyInstance) {
  app.get<{ Querystring: { q?: string } }>('/search', async (req, reply) => {
    const q = (req.query.q ?? '').trim().toLowerCase()
    if (q.length < 2) {
      return { success: true, data: { query: q, matches: [], teams: [], series: [] } satisfies SearchResults }
    }
    try {
      const [all, seriesRes] = await Promise.all([
        getAllMatchesCached(app.redis).catch(() => [] as Match[]),
        getSeriesList().catch(() => [] as { id: string; name: string }[]),
      ])

      const matches = all
        .filter((m) =>
          m.name?.toLowerCase().includes(q) ||
          m.teams.some((t) => t.toLowerCase().includes(q)) ||
          m.venue?.toLowerCase().includes(q),
        )
        .slice(0, 30)

      const teamMap = new Map<string, { name: string; short: string }>()
      for (const m of all) {
        m.teams.forEach((name, i) => {
          if (name && name.toLowerCase().includes(q)) {
            teamMap.set(name.toLowerCase(), { name, short: m.teamInfo?.[i]?.shortname || name.slice(0, 3).toUpperCase() })
          }
        })
      }

      const series = (seriesRes ?? []).filter((s) => s.name?.toLowerCase().includes(q)).slice(0, 10)

      return {
        success: true,
        data: { query: q, matches, teams: [...teamMap.values()].slice(0, 12), series } satisfies SearchResults,
      }
    } catch (e) {
      req.log.error({ err: e }, 'search error')
      return reply.status(500).send({ success: false, error: 'Service unavailable' })
    }
  })
}
