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
        text: 'The CricketFast mobile app includes 9 match tabs: Live Line, Session, Rates, Win %, Scorecard, History, Squad, Table and Info.',
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
      }) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }} />
      <PageRefresher intervalMs={15_000} />
      <SiteHeader />
      <section className="hero-banner">
        <div className="container hero-inner">
          <div className="hero-copy">
            <h1 className="hero-h1">Live Cricket Scores</h1>
            <p className="hero-lead">Ball-by-ball updates for IPL, Tests, ODIs and T20. Free — no login.</p>
          </div>
          <div className="hero-stats">
            <div className="hero-stat">
              <strong>{liveRes.data.length}</strong>
              <small>Live now</small>
            </div>
            <div className="hero-stat">
              <strong>15s</strong>
              <small>Auto refresh</small>
            </div>
            <div className="hero-stat">
              <strong>Free</strong>
              <small>No signup</small>
            </div>
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
            cachedAt,
          }} />

          <section className="seo-block" id="download">
            <h2>Why CricketFast?</h2>
            <p>
              Real-time cricket scores and scorecards. Tap any match for the full summary.
              Download the Android app for live line, session breakdown, win probability, squad, head-to-head and points table.
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
                <h3>Free forever?</h3>
                <p>Yes — no login, no subscription. Web scores and the app are both free.</p>
              </div>
            </div>
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
            <div className="widget-head">In the app</div>
            <div className="widget-body feature-list">
              <p>Live line &amp; last 30 balls</p>
              <p>Session phases (PP / middle / death)</p>
              <p>Win % prediction</p>
              <p>Squad &amp; points table</p>
              <p>Swipe between tabs</p>
            </div>
          </div>
          <div className="widget widget-cta">
            <div className="widget-head">Get the App</div>
            <div className="widget-body download-box">
              <p>Deeper live line than the web — 9 tabs per match.</p>
              <AppDownloadButton />
            </div>
          </div>
        </aside>
      </div>
      <SiteFooter />
    </>
  )
}
