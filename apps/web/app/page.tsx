import { MatchCard } from '@/components/MatchCard'
import { SiteHeader } from '@/components/SiteHeader'
import { getLiveMatches, getRecentMatches, getSeriesList, getUpcomingMatches } from '@/lib/api'

export const revalidate = 15

export default async function HomePage() {
  const [liveRes, recentRes, upcomingRes, seriesRes] = await Promise.all([
    getLiveMatches().catch(() => ({ success: false, data: [] })),
    getRecentMatches().catch(() => ({ success: false, data: [] })),
    getUpcomingMatches().catch(() => ({ success: false, data: [] })),
    getSeriesList().catch(() => ({ success: false, data: [] })),
  ])

  const live = liveRes.data ?? []
  const recent = recentRes.data ?? []
  const upcoming = (upcomingRes.data ?? []).slice(0, 8)
  const series = (seriesRes.data ?? []).slice(0, 10)

  return (
    <>
      <SiteHeader />
      <main className="container">
        <div className="live-bar">
          <span className="live-dot" />
          <span>{live.length} live match{live.length !== 1 ? 'es' : ''} · updates every 15s</span>
        </div>

        <h2 className="section-title">Live Cricket Score</h2>
        {live.length === 0 ? (
          <p style={{ color: 'var(--muted)' }}>No live matches right now. Check fixtures below.</p>
        ) : (
          live.map((m) => <MatchCard key={m.id} match={m} showTime />)
        )}

        <div className="ad-slot">Advertisement — slot reserved</div>

        <h2 className="section-title">Popular Series</h2>
        <div className="chips">
          {series.map((s) => (
            <span key={s.id} className="chip">{s.name}</span>
          ))}
        </div>

        <div className="grid-2">
          <section>
            <h2 className="section-title">Recent Matches</h2>
            {recent.slice(0, 6).map((m) => <MatchCard key={m.id} match={m} />)}
          </section>
          <section>
            <h2 className="section-title">Upcoming Fixtures</h2>
            {upcoming.map((m) => <MatchCard key={m.id} match={m} showTime />)}
          </section>
        </div>

        <h2 className="section-title">Team Rankings (T20)</h2>
        <div className="table-wrap">
          <table>
            <thead>
              <tr><th>Rank</th><th>Team</th><th>Rating</th></tr>
            </thead>
            <tbody>
              {[
                ['1', 'India', '275'],
                ['2', 'England', '262'],
                ['3', 'Australia', '258'],
                ['4', 'New Zealand', '247'],
                ['5', 'South Africa', '244'],
              ].map(([r, t, rating]) => (
                <tr key={r}><td>{r}</td><td>{t}</td><td>{rating}</td></tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="ad-slot">Advertisement — slot reserved</div>

        <section className="seo-block" id="download">
          <h2 style={{ marginTop: 0 }}>CricketFast Live Line — Ball by Ball Cricket Score</h2>
          <p>
            Welcome to CricketFast Live Line, your destination for live cricket scores and scorecards.
            Follow IPL, international Tests, ODIs and T20 leagues with real-time updates.
            Download our app for live line, session view, squad, history and points table.
          </p>
        </section>

        <section className="faq">
          <h3>What services does CricketFast offer?</h3>
          <p>Live cricket scores, scorecards, fixtures, squad, history and series points tables — free with no login.</p>
          <h3>How fast are live updates?</h3>
          <p>Scores refresh every 10–30 seconds. The mobile app includes dedicated live line, session and rates tabs.</p>
          <h3>Do I need to pay?</h3>
          <p>No. All live scores and match details are free on web and app.</p>
        </section>

        <footer className="site-footer">
          <p>© {new Date().getFullYear()} CricketFast Live Line · cricketfastliveline.in</p>
          <p>Data via CricAPI · Not affiliated with ICC or BCCI</p>
        </footer>
      </main>
    </>
  )
}
