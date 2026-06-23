import Link from 'next/link'
import { AppDownloadButton } from '@/components/AppDownloadButton'
import { DailySection } from '@/components/DailySection'
import { LiveScoresPanel } from '@/components/LiveScoresPanel'
import { PageRefresher } from '@/components/PageRefresher'
import { SiteFooter } from '@/components/SiteFooter'
import { SiteHeader } from '@/components/SiteHeader'
import { FALLBACK_SERIES, getDaily, getLiveMatches, getRecentMatches, getSeriesList, getUpcomingMatches } from '@/lib/api'
import { getSiteUrl } from '@/lib/site'

export const revalidate = 15

const faqJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'FAQPage',
  mainEntity: [
    {
      '@type': 'Question',
      name: 'What is live line, session and scorecard?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'The CricketFast mobile app includes 9 match tabs: Live Line, Session, Rates, Win %, Scorecard, History, Squad, Table and Info.',
      },
    },
    {
      '@type': 'Question',
      name: 'How often do live scores update?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Scores and ball-by-ball commentary refresh automatically through every over of a live match.',
      },
    },
  ],
}

export default async function HomePage() {
  const [seriesRes, liveRes, recentRes, upcomingRes, dailyRes] = await Promise.all([
    getSeriesList(),
    getLiveMatches(),
    getRecentMatches(),
    getUpcomingMatches(),
    getDaily(),
  ])
  const series = (seriesRes.data?.length ? seriesRes.data : FALLBACK_SERIES).slice(0, 12)
  const stale = liveRes.stale || recentRes.stale || upcomingRes.stale
  const cachedAt = Math.max(liveRes.cachedAt ?? 0, recentRes.cachedAt ?? 0, upcomingRes.cachedAt ?? 0) || undefined

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify({
        '@context': 'https://schema.org',
        '@type': 'WebSite',
        name: 'CricketFast Live Line',
        url: getSiteUrl(),
        description: 'Live cricket scores, ball-by-ball updates and scorecards for IPL, Tests, ODIs and T20.',
        potentialAction: {
          '@type': 'SearchAction',
          target: { '@type': 'EntryPoint', urlTemplate: `${getSiteUrl()}/search?q={search_term_string}` },
          'query-input': 'required name=search_term_string',
        },
      }) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }} />
      <PageRefresher intervalMs={15_000} />
      <SiteHeader />
      <h1 className="sr-only">Live Cricket Scores — IPL, Tests, ODIs & T20 ball-by-ball</h1>

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

          <section className="seo-block" id="download">
            <h2>Why CricketFast?</h2>
            <p>
              Real-time cricket scores, scorecards, ball-by-ball and stats across IPL, internationals and T20 leagues. Tap any match for the full summary.
            </p>
          </section>

          <section className="faq">
            <h2>FAQ</h2>
            <div className="faq-grid">
              <div>
                <h3>Live line &amp; session</h3>
                <p>The app has dedicated tabs for ball-by-ball live line, powerplay/middle/death session stats, and full scorecard.</p>
              </div>
              <div>
                <h3>Formats covered</h3>
                <p>Full coverage across Test, ODI and T20 — internationals, the IPL and major franchise leagues.</p>
              </div>
            </div>
          </section>
        </main>

        <aside className="sidebar">
          <div className="widget" id="series">
            <div className="widget-head">Popular Series</div>
            <div className="widget-body chips">
              {series.map((s) => <Link key={s.id} href={`/series/${s.id}`} className="chip">{s.name}</Link>)}
            </div>
          </div>
          <div className="widget widget-cta">
            <div className="widget-head">CricketFast App</div>
            <div className="widget-body download-box">
              <p>Faster live line on Android.</p>
              <AppDownloadButton />
            </div>
          </div>
        </aside>
      </div>
      <SiteFooter />
    </>
  )
}
