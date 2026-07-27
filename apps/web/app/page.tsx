import type { Metadata } from 'next'
import Link from 'next/link'
import { DailySection } from '@/components/DailySection'
import { LiveScoresPanel } from '@/components/LiveScoresPanel'
import { PageRefresher } from '@/components/PageRefresher'
import { SiteHeader } from '@/components/SiteHeader'
import {
  FALLBACK_SERIES,
  getDaily,
  getLiveMatches,
  getRecentMatches,
  getSeriesList,
  getUpcomingMatches,
  splitSeriesByTiming,
} from '@/lib/api'
import { getAndroidAppUrl } from '@/lib/appLinks'
import {
  BRAND_DESCRIPTION, BRAND_KEYWORDS, BRAND_NAME, BRAND_OG_DESCRIPTION, BRAND_POSITIONING,
} from '@/lib/brand'
import { getSiteUrl } from '@/lib/site'

export const revalidate = 15

function seriesWhen(start?: string, end?: string) {
  const fmt = (iso?: string) => {
    if (!iso) return ''
    const d = new Date(iso)
    if (Number.isNaN(d.getTime())) return ''
    return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })
  }
  const a = fmt(start)
  const b = fmt(end)
  if (a && b && a !== b) return `${a} – ${b}`
  return a || b
}

export const metadata: Metadata = {
  title: `${BRAND_NAME} — live cricket & smart insights`,
  description: BRAND_DESCRIPTION,
  keywords: [...BRAND_KEYWORDS],
  alternates: { canonical: getSiteUrl() },
  openGraph: {
    title: `${BRAND_NAME} — live cricket & smart insights`,
    description: BRAND_OG_DESCRIPTION,
    url: getSiteUrl(),
    type: 'website',
    images: [{ url: `${getSiteUrl()}/og.svg`, width: 1200, height: 630, alt: BRAND_NAME }],
  },
  twitter: {
    card: 'summary_large_image',
    title: `${BRAND_NAME} — live cricket & smart insights`,
    description: BRAND_OG_DESCRIPTION,
    images: [`${getSiteUrl()}/og.svg`],
  },
}

const playUrl = getAndroidAppUrl()
const appJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'SoftwareApplication',
  name: BRAND_NAME,
  applicationCategory: 'SportsApplication',
  operatingSystem: 'Android',
  ...(playUrl ? { url: playUrl, downloadUrl: playUrl } : { url: getSiteUrl() }),
  description: `Android app for ${BRAND_POSITIONING}. Scorecards, squads and fixtures.`,
  offers: { '@type': 'Offer', price: '0', priceCurrency: 'INR' },
}

const orgJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'Organization',
  name: BRAND_NAME,
  url: getSiteUrl(),
  logo: `${getSiteUrl()}/og.svg`,
  sameAs: ['https://x.com/ChaiPeCric'],
}

export default async function HomePage() {
  const [seriesRes, liveRes, recentRes, upcomingRes, dailyRes] = await Promise.all([
    getSeriesList(),
    getLiveMatches(),
    getRecentMatches(),
    getUpcomingMatches(),
    getDaily(),
  ])
  const series = seriesRes.data?.length ? seriesRes.data : FALLBACK_SERIES
  const { upcoming: seriesUpcoming, concluded: seriesDone } = splitSeriesByTiming(series)
  const stale = liveRes.stale || recentRes.stale || upcomingRes.stale
  const cachedAt = Math.max(liveRes.cachedAt ?? 0, recentRes.cachedAt ?? 0, upcomingRes.cachedAt ?? 0) || undefined

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify({
        '@context': 'https://schema.org',
        '@type': 'WebSite',
        name: BRAND_NAME,
        url: getSiteUrl(),
        description: BRAND_DESCRIPTION,
        potentialAction: {
          '@type': 'SearchAction',
          target: { '@type': 'EntryPoint', urlTemplate: `${getSiteUrl()}/search?q={search_term_string}` },
          'query-input': 'required name=search_term_string',
        },
      }) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(appJsonLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(orgJsonLd) }} />
      <PageRefresher intervalMs={15_000} />
      <SiteHeader />
      <h1 className="sr-only">{BRAND_NAME} — {BRAND_POSITIONING} — IPL, Tests, ODIs &amp; T20</h1>

      <div className="container page-layout">
        <main className="main-col">
          {dailyRes.data?.matchOfTheDay && <DailySection data={dailyRes.data} />}

          <LiveScoresPanel initial={{
            live: liveRes.data,
            recent: recentRes.data,
            upcoming: upcomingRes.data,
            stale,
            cachedAt,
          }} />
        </main>

        <aside className="sidebar">
          {(seriesUpcoming.length > 0 || seriesDone.length > 0) ? (
            <nav className="series-index" id="series" aria-label="Series">
              <div className="series-index-head">
                <h2>Series</h2>
                <Link href="/series" className="series-index-all">All</Link>
              </div>
              {seriesUpcoming.length > 0 ? (
                <div className="series-index-group">
                  <p className="series-index-label">Coming up</p>
                  <ul className="series-index-list">
                    {seriesUpcoming.slice(0, 6).map((s) => {
                      const when = seriesWhen(s.startDate, s.endDate)
                      return (
                        <li key={s.id}>
                          <Link href={`/series/${s.id}`}>
                            <span className="series-index-name">{s.name}</span>
                            {when ? <span className="series-index-when">{when}</span> : null}
                          </Link>
                        </li>
                      )
                    })}
                  </ul>
                </div>
              ) : null}
              {seriesDone.length > 0 ? (
                <div className="series-index-group">
                  <p className="series-index-label">Wrapped</p>
                  <ul className="series-index-list">
                    {seriesDone.slice(0, 4).map((s) => {
                      const when = seriesWhen(s.startDate, s.endDate)
                      return (
                        <li key={s.id}>
                          <Link href={`/series/${s.id}`}>
                            <span className="series-index-name">{s.name}</span>
                            {when ? <span className="series-index-when">{when}</span> : null}
                          </Link>
                        </li>
                      )
                    })}
                  </ul>
                </div>
              ) : null}
            </nav>
          ) : null}
        </aside>
      </div>
    </>
  )
}
