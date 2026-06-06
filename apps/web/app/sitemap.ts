import type { MetadataRoute } from 'next'
import { getLiveMatches, getRecentMatches } from '@/lib/api'
import { getSiteUrl } from '@/lib/site'

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const site = getSiteUrl()
  const entries: MetadataRoute.Sitemap = [
    {
      url: site,
      lastModified: new Date(),
      changeFrequency: 'always',
      priority: 1,
    },
  ]

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
