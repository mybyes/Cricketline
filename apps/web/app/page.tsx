import { AppDownloadButton } from '@/components/AppDownloadButton'
import { LiveScoresPanel } from '@/components/LiveScoresPanel'
import { PageRefresher } from '@/components/PageRefresher'
import { SiteFooter } from '@/components/SiteFooter'
import { SiteHeader } from '@/components/SiteHeader'
import { FALLBACK_SERIES, getLiveMatches, getRecentMatches, getSeriesList, getUpcomingMatches } from '@/lib/api'
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
        text: 'The CricketFast mobile app includes 8 match tabs: Live Line, Session, Rates, Scorecard, History, Squad, Table and Info.',
      },
    },
    {
      '@type': 'Question',
      name: 'Is CricketFast free?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Yes — no login, no subscription. Web and app are free.',
      },
    },
  ],
}

export default async function HomePage() {
  const [seriesRes, liveRes, recentRes, upcomingRes] = await Promise.all([
    getSeriesList(),
    getLiveMatches(),
    getRecentMatches(),
    getUpcomingMatches(),
  ])
  const series = (seriesRes.data?.length ? seriesRes.data : FALLBACK_SERIES).slice(0, 14)
  const stale = liveRes.stale || recentRes.stale || upcomingRes.stale
  const error = liveRes.error && !liveRes.data.length ? liveRes.error : undefined

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify({
        '@context': 'https://schema.org',
        '@type': 'WebSite',
        name: 'CricketFast Live Line',
        url: getSiteUrl(),
        description: 'Live cricket scores, ball-by-ball updates and scorecards for IPL, Tests, ODIs and T20.',
      }) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }} />
      <PageRefresher intervalMs={15_000} />
      <SiteHeader />
      <section className="hero-banner">
        <div className="container hero-inner">
          <div>
            <h1 className="hero-h1">Live Cricket Scores</h1>
            <p>Ball-by-ball scores · IPL · Tests · ODIs · T20 — free, no login</p>
          </div>
          <div className="hero-stats">
            <div className="hero-stat"><span>⚡</span><small>15s refresh</small></div>
            <div className="hero-stat"><span>📊</span><small>8 app tabs</small></div>
            <div className="hero-stat"><span>🏏</span><small>All formats</small></div>
          </div>
        </div>
      </section>

      <div className="container page-layout">
        <main className="main-col">
          <LiveScoresPanel initial={{
            live: liveRes.data,
            recent: recentRes.data,
            upcoming: upcomingRes.data,
            stale,
            error,
          }} />
          <div className="ad-slot">Advertisement</div>
          <section className="seo-block" id="download">
            <h2>CricketFast Live Line — Fastest Cricket Scores</h2>
            <p>
              Real-time live cricket scores and scorecards for IPL, international Tests, ODIs and domestic T20.
              Tap any match for details. Download the Android app for live line, session, match rates, squad,
              head-to-head history and series points table.
            </p>
          </section>
          <section className="faq">
            <h3>Live line, session &amp; scorecard</h3>
            <p>Mobile app includes 8 match tabs: Live Line, Session, Rates, Scorecard, History, Squad, Table and Info.</p>
            <h3>Free forever?</h3>
            <p>Yes — no login, no subscription. Web and app are free.</p>
          </section>
        </main>

        <aside className="sidebar">
          <div className="widget" id="series">
            <div className="widget-head">Popular Series</div>
            <div className="widget-body chips">
              {series.map((s) => <span key={s.id} className="chip">{s.name}</span>)}
            </div>
          </div>
          <div className="widget">
            <div className="widget-head">Features</div>
            <div className="widget-body feature-list">
              <p>✓ Live line &amp; ball-by-ball</p>
              <p>✓ Session view (Tests)</p>
              <p>✓ Squad &amp; playing XI</p>
              <p>✓ H2H history</p>
              <p>✓ Points table</p>
            </div>
          </div>
          <div className="widget">
            <div className="widget-head">Get the App</div>
            <div className="widget-body download-box">
              <AppDownloadButton />
            </div>
          </div>
        </aside>
      </div>
      <SiteFooter />
    </>
  )
}
