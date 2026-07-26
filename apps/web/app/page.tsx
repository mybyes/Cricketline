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
  title: 'Cricket Pulse – Live Line & AI',
  description:
    'Cricket Pulse – Live Line & AI: real-time scores, display-only match odds & session markets, scorecards, squads and fixtures — IPL, Tests, ODIs & T20. Free, no login.',
  keywords: [
    'live cricket line', 'cricket live line', 'live line app',
    'live cricket score', 'cricket scorecard', 'match odds', 'session markets',
    'IPL live score', 'fastest live cricket score', 'cricket pulse',
  ],
  alternates: { canonical: getSiteUrl() },
  openGraph: {
    title: 'Cricket Pulse – Live Line & AI',
    description: 'Real-time cricket live line, display-only markets and scorecards — IPL, Tests, ODIs & T20.',
    url: getSiteUrl(),
    type: 'website',
    images: [{ url: `${getSiteUrl()}/og.svg`, width: 1200, height: 630, alt: 'Cricket Pulse' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Cricket Pulse – Live Line & AI',
    description: 'Live scores, display-only markets & scorecards. Free, no login.',
    images: [`${getSiteUrl()}/og.svg`],
  },
}

const playUrl = getAndroidAppUrl()
const appJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'SoftwareApplication',
  name: 'Cricket Pulse – Live Line & AI',
  applicationCategory: 'SportsApplication',
  operatingSystem: 'Android',
  ...(playUrl ? { url: playUrl, downloadUrl: playUrl } : { url: getSiteUrl() }),
  description: 'Android cricket live line app — real-time scores, display-only markets, scorecards, squads and fixtures.',
  offers: { '@type': 'Offer', price: '0', priceCurrency: 'INR' },
}

const orgJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'Organization',
  name: 'Cricket Pulse',
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
        name: 'Cricket Pulse',
        url: getSiteUrl(),
        description: 'Cricket Pulse – Live Line & AI: display-only markets and scorecards for IPL, Tests, ODIs and T20.',
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
      <h1 className="sr-only">Cricket Pulse – Live Line &amp; AI — IPL, Tests, ODIs &amp; T20</h1>

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
