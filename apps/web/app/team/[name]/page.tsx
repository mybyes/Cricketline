import type { Metadata } from 'next'
import { MatchGrid } from '@/components/MatchGrid'
import { PortalLayout } from '@/components/PortalLayout'
import { getLiveMatches, getRankings, getRecentMatches, getUpcomingMatches, type Match } from '@/lib/api'

export const revalidate = 60

const involves = (m: Match, team: string) =>
  m.teams.some((t) => t.toLowerCase() === team.toLowerCase())

export async function generateMetadata({ params }: { params: Promise<{ name: string }> }): Promise<Metadata> {
  const { name } = await params
  const team = decodeURIComponent(name)
  return {
    title: `${team} — Live Scores, Fixtures, Results & Ranking | CricketFast`,
    description: `Follow ${team}: live scores, upcoming fixtures, recent results and ICC ranking.`,
    alternates: { canonical: `/team/${encodeURIComponent(team)}` },
  }
}

export default async function TeamPage({ params }: { params: Promise<{ name: string }> }) {
  const { name } = await params
  const team = decodeURIComponent(name)
  const [live, upcoming, recent, rankings] = await Promise.all([
    getLiveMatches(), getUpcomingMatches(), getRecentMatches(), getRankings(),
  ])

  const tLive = live.data.filter((m) => involves(m, team))
  const tUpcoming = upcoming.data.filter((m) => involves(m, team))
  const tRecent = recent.data.filter((m) => involves(m, team))
  const none = !tLive.length && !tUpcoming.length && !tRecent.length

  // ICC ranking across formats (international teams only)
  const base = team.toLowerCase().replace(/\s+women$/, '')
  const ranks = rankings.data?.teams
    ? (['test', 'odi', 't20'] as const)
        .map((f) => ({ fmt: f.toUpperCase(), row: rankings.data!.teams[f].find((r) => r.team.toLowerCase() === base) }))
        .filter((x) => x.row)
    : []

  // Recent record from results
  const won = tRecent.filter((m) => new RegExp(`${team}\\b`, 'i').test(m.status) && /won/i.test(m.status)).length
  const played = tRecent.length

  return (
    <PortalLayout
      title={team}
      subtitle="Form, fixtures, results & ranking"
      refresh
      crumbs={[{ name: 'Home', href: '/' }, { name: 'Teams', href: '/teams' }, { name: team, href: `/team/${encodeURIComponent(team)}` }]}
    >
      {(ranks.length > 0 || played > 0) && (
        <div className="team-stat-bar">
          {ranks.map((r) => (
            <span key={r.fmt} className="team-rank-chip">{r.fmt} <strong>#{r.row!.rank}</strong> <small>{r.row!.rating}</small></span>
          ))}
          {played > 0 && <span className="team-rank-chip">Recent <strong>{won}W</strong> <small>of {played}</small></span>}
        </div>
      )}

      {none ? (
        <div className="empty-state">
          <p className="empty-title">No current matches for {team}</p>
          <p className="empty-sub">Check fixtures for the full schedule.</p>
        </div>
      ) : (
        <>
          {tLive.length > 0 && (<><h2 className="section-title">Live</h2><MatchGrid matches={tLive} /></>)}
          {tUpcoming.length > 0 && (<><h2 className="section-title">Fixtures</h2><MatchGrid matches={tUpcoming} showTime /></>)}
          {tRecent.length > 0 && (<><h2 className="section-title">Results</h2><MatchGrid matches={tRecent} showTime /></>)}
        </>
      )}
    </PortalLayout>
  )
}
