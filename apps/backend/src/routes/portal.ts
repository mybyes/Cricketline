import { FastifyInstance } from 'fastify'
import { getAllMatchesCached } from '../services/cricapi'
import { RANKINGS } from '../services/rankings'

export type TeamCategory = 'international' | 'league' | 'other'

export interface TeamSummary {
  name: string
  short: string
  matches: number
  live: number
  upcoming: number
  category: TeamCategory
}

const COUNTRIES = new Set([
  'india', 'australia', 'england', 'south africa', 'new zealand', 'pakistan', 'sri lanka',
  'bangladesh', 'west indies', 'afghanistan', 'zimbabwe', 'ireland', 'scotland', 'netherlands',
  'nepal', 'united arab emirates', 'uae', 'usa', 'united states', 'oman', 'namibia', 'canada',
  'hong kong', 'papua new guinea', 'png',
])

const LEAGUE_RE = /\b(ipl|indian premier league|big bash|bbl|the hundred|psl|pakistan super|cpl|caribbean premier|sa20|ilt20|mlc|major league|super smash|t20 blast|vitality|lanka premier|lpl|bangladesh premier|bpl|county|ranji|syed mushtaq|vijay hazare)\b/i

function classifyTeam(name: string, leagueHit: boolean): TeamCategory {
  const base = name.toLowerCase().replace(/\s+women$/, '').trim()
  if (COUNTRIES.has(base)) return 'international'
  if (leagueHit) return 'league'
  return 'other'
}

export default async function portalRoute(app: FastifyInstance) {
  app.get('/rankings', async () => ({ success: true, data: RANKINGS }))

  app.get('/teams', async (req, reply) => {
    try {
      const all = await getAllMatchesCached(app.redis)
      const leagueByTeam = new Map<string, boolean>()
      const map = new Map<string, TeamSummary>()
      for (const m of all) {
        const isLeague = LEAGUE_RE.test(m.name ?? '')
        m.teams.forEach((name, i) => {
          if (!name) return
          const key = name.toLowerCase()
          if (isLeague) leagueByTeam.set(key, true)
          const short = m.teamInfo?.[i]?.shortname || name.slice(0, 3).toUpperCase()
          const row = map.get(key) ?? { name, short, matches: 0, live: 0, upcoming: 0, category: 'other' as TeamCategory }
          row.matches++
          if (m.matchStarted && !m.matchEnded) row.live++
          if (!m.matchStarted && !m.matchEnded) row.upcoming++
          map.set(key, row)
        })
      }
      for (const [key, row] of map) {
        row.category = classifyTeam(row.name, leagueByTeam.get(key) ?? false)
      }
      const data = [...map.values()].sort((a, b) => b.matches - a.matches)
      return { success: true, data }
    } catch (e) {
      req.log.error({ err: e }, 'teams error')
      return reply.status(500).send({ success: false, error: 'Service unavailable' })
    }
  })
}
