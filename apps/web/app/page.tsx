import { AlertBanner } from '@/components/AlertBanner'
import { MatchCard } from '@/components/MatchCard'
import { SiteFooter } from '@/components/SiteFooter'
import { SiteHeader } from '@/components/SiteHeader'
import { FALLBACK_SERIES, getLiveMatches, getRecentMatches, getSeriesList, getUpcomingMatches } from '@/lib/api'

export const revalidate = 15

export default async function HomePage() {
  const [liveRes, recentRes, upcomingRes, seriesRes] = await Promise.all([
    getLiveMatches(),
    getRecentMatches(),
    getUpcomingMatches(),
    getSeriesList(),
  ])

  const live = liveRes.data ?? []
  const recent = recentRes.data ?? []
  const upcoming = (upcomingRes.data ?? []).slice(0, 10)
  const series = (seriesRes.data?.length ? seriesRes.data : FALLBACK_SERIES).slice(0, 12)

  const anyStale = liveRes.stale || recentRes.stale || upcomingRes.stale || seriesRes.stale
  const anyError = liveRes.error || recentRes.error
  const hasData = live.length + recent.length + upcoming.length > 0

  return (
    <>
      <SiteHeader />
      <div className="container">
        <AlertBanner stale={anyStale} message={!hasData ? anyError : undefined} />

        <div className="live-bar">
          <span className="live-dot" />
          <span>
            {live.length} live · {upcoming.length} upcoming · refreshes every 15s
          </span>
        </div>

        <div className="page-layout">
          <div className="main-col">
            <h2 className="section-title">Live Cricket Score</h2>
            {live.length === 0 ? (
              <div className="empty-state">
                No live matches right now. Check recent results and fixtures below.
              </div>
            ) : (
              live.map((m) => <MatchCard key={m.id} match={m} showTime />)
            )}

            <div className="ad-slot">Advertisement</div>

            <h2 className="section-title" id="fixtures">Recent Results</h2>
            {recent.length === 0 ? (
              <div className="empty-state">Recent results will appear when API is connected.</div>
            ) : (
              recent.slice(0, 8).map((m) => <MatchCard key={m.id} match={m} compact />)
            )}

            <h2 className="section-title">Upcoming Fixtures</h2>
            {upcoming.length === 0 ? (
              <div className="empty-state">No upcoming fixtures loaded.</div>
            ) : (
              upcoming.map((m) => <MatchCard key={m.id} match={m} showTime />)
            )}

            <section className="seo-block" id="download">
              <h2>CricketFast Live Line — Ball by Ball Cricket Score</h2>
              <p>
                Welcome to CricketFast Live Line — live cricket scores, scorecards and ball-by-ball updates
                for IPL, international Tests, ODIs and T20 leagues. Free, fast, no login required.
                Download our app for live line, session view, match rates, squad, history and points table.
              </p>
            </section>

            <section className="faq">
              <h3>What services does CricketFast offer?</h3>
              <p>Live cricket scores, scorecards, fixtures, squad, history and series points tables — free with no login.</p>
              <h3>How fast are live updates?</h3>
              <p>Web refreshes every 15 seconds. The mobile app polls every 12–30 seconds with dedicated live line tabs.</p>
              <h3>Do I need to pay?</h3>
              <p>No. All live scores and match details are free on web and app.</p>
            </section>
          </div>

          <aside className="sidebar">
            <div className="widget" id="series">
              <div className="widget-head">Popular Series</div>
              <div className="widget-body chips">
                {series.map((s) => (
                  <span key={s.id} className="chip">{s.name}</span>
                ))}
              </div>
            </div>

            <div className="widget" id="rankings">
              <div className="widget-head">T20 Rankings</div>
              <div className="widget-body table-wrap">
                <table>
                  <thead>
                    <tr><th>#</th><th>Team</th><th>Pts</th></tr>
                  </thead>
                  <tbody>
                    {[
                      ['1', 'India', '275'],
                      ['2', 'England', '262'],
                      ['3', 'Australia', '258'],
                      ['4', 'New Zealand', '247'],
                      ['5', 'South Africa', '244'],
                      ['6', 'Pakistan', '238'],
                    ].map(([r, t, pts]) => (
                      <tr key={r}><td>{r}</td><td>{t}</td><td>{pts}</td></tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="widget">
              <div className="widget-head">Download App</div>
              <div className="widget-body download-box">
                <p>Live line · Session · Rates · Squad · History · Table</p>
                <div className="store-btns">
                  <a className="store-btn" href="#download">📱 Android App (coming soon)</a>
                  <a className="store-btn" href="#download">🍎 iOS App (coming soon)</a>
                </div>
              </div>
            </div>

            <div className="ad-slot">Advertisement</div>
          </aside>
        </div>
      </div>
      <SiteFooter />
    </>
  )
}
