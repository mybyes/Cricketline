import type { MetadataRoute } from 'next'
import { getLiveMatches, getRecentMatches, getSeriesList, getTeams, getUpcomingMatches } from '@/lib/api'
import { getSiteUrl } from '@/lib/site'

export const revalidate = 3600

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const site = getSiteUrl()
  const now = new Date()

  const staticPaths = ['', '/live', '/matches', '/series', '/fixtures', '/results', '/rankings', '/teams']
  const entries: MetadataRoute.Sitemap = staticPaths.map((p) => ({
    url: `${site}${p}`,
    lastModified: now,
    changeFrequency: p === '' || p === '/live' ? 'always' : 'daily',
    priority: p === '' ? 1 : 0.8,
  }))

  try {
    const [live, recent, upcoming, series, teams] = await Promise.all([
      getLiveMatches(), getRecentMatches(), getUpcomingMatches(), getSeriesList(), getTeams(),
    ])

    const seen = new Set<string>()
    for (const m of [...live.data, ...recent.data, ...upcoming.data]) {
      if (!m?.id || seen.has(m.id)) continue
      seen.add(m.id)
      const isLive = m.matchStarted && !m.matchEnded
      entries.push({
        url: `${site}/match/${m.id}`,
        lastModified: m.dateTimeGMT ? new Date(m.dateTimeGMT) : now,
        changeFrequency: isLive ? 'always' : 'weekly',
        priority: isLive ? 0.9 : 0.6,
      })
    }

    for (const s of series.data ?? []) {
      if (!s?.id) continue
      entries.push({ url: `${site}/series/${s.id}`, lastModified: now, changeFrequency: 'daily', priority: 0.6 })
    }

    for (const t of Array.isArray(teams.data) ? teams.data : []) {
      if (!t?.name) continue
      entries.push({ url: `${site}/team/${encodeURIComponent(t.name)}`, lastModified: now, changeFrequency: 'daily', priority: 0.5 })
    }
  } catch {
    // static entries still return if API is unavailable
  }

  return entries
}
