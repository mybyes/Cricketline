import type { MetadataRoute } from 'next'
import { getLiveMatches, getRecentMatches } from '@/lib/api'
import { getSiteUrl } from '@/lib/site'

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const site = getSiteUrl()
  const staticPaths = ['', '/live', '/matches', '/series', '/fixtures', '/results', '/rankings', '/teams']
  const entries: MetadataRoute.Sitemap = staticPaths.map((p) => ({
    url: `${site}${p}`,
    lastModified: new Date(),
    changeFrequency: p === '' || p === '/live' ? 'always' : 'daily',
    priority: p === '' ? 1 : 0.8,
  }))

  try {
    const [live, recent] = await Promise.all([getLiveMatches(), getRecentMatches()])
    const seen = new Set<string>()
    for (const m of [...live.data, ...recent.data]) {
      if (seen.has(m.id)) continue
      seen.add(m.id)
      entries.push({
        url: `${site}/match/${m.id}`,
        lastModified: m.dateTimeGMT ? new Date(m.dateTimeGMT) : new Date(),
        changeFrequency: m.matchStarted && !m.matchEnded ? 'always' : 'daily',
        priority: m.matchStarted && !m.matchEnded ? 0.9 : 0.7,
      })
    }
  } catch {
    // sitemap still returns homepage if API unavailable
  }

  return entries
}
