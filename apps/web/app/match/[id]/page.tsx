import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { Breadcrumbs } from '@/components/Breadcrumbs'
import { AdSlot } from '@/components/AdSlot'
import { ChaseStrip } from '@/components/ChaseStrip'
import { MatchTabs, type MatchTab } from '@/components/MatchTabs'
import { PageRefresher } from '@/components/PageRefresher'
import { Scorecard } from '@/components/Scorecard'
import { SiteHeader } from '@/components/SiteHeader'
import { Squads } from '@/components/Squads'
import { LastBallBanner } from '@/components/LastBallBanner'
import { MatchHistory } from '@/components/MatchHistory'
import { OddsPanel } from '@/components/OddsPanel'
import { getBallByBall, getMatchOdds, getScorecard, getSquad, type BbbBall, type MatchOddsBoard, type ScorecardData, type SquadTeam } from '@/lib/api'
import { synthRatesBoard } from '@/lib/matchRates'
import { getSiteUrl } from '@/lib/site'
import { teamColor } from '@/lib/teamColors'

export const revalidate = 12

function seriesOf(name: string) {
  const parts = name.split(',').map((s) => s.trim())
  return parts.length >= 2 ? parts[parts.length - 1] : ''
}

async function loadMatch(id: string): Promise<{
  data: ScorecardData | null
  bbb: BbbBall[]
  squads: SquadTeam[]
  odds: MatchOddsBoard | null
}> {
  const [score, bbb, squad, odds] = await Promise.all([
    getScorecard(id),
    getBallByBall(id),
    getSquad(id),
    getMatchOdds(id),
  ])
  const data = score.data && typeof score.data === 'object' && 'teams' in score.data ? score.data : null
  const oddsBoard = odds.data && Array.isArray(odds.data.matchOdds) ? odds.data : null
  return {
    data,
    bbb: Array.isArray(bbb.data) ? bbb.data : [],
    squads: Array.isArray(squad.data) ? squad.data : [],
    odds: oddsBoard,
  }
}

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params
  const { data } = await loadMatch(id)
  const site = getSiteUrl()
  if (!data) return { title: 'Match not found' }
  const teams = data.teams.join(' vs ')
  const scoreStr = data.score?.map((s) => `${s.r}/${s.w}`).join(' · ') ?? ''
  const live = data.matchStarted && !data.matchEnded
  const title = `${teams} — Live Line, History & Scorecard`
  const description = `${data.status}${scoreStr ? `. ${scoreStr}` : ''}. Live line with display-only odds, match history, scorecard and squads. ${data.venue}.`
  const url = `${site}/match/${id}`
  const ogTitle = live ? `${teams} Live Line & Score` : `${teams} Scorecard & Result`
  return {
    title,
    description,
    alternates: { canonical: url },
    openGraph: {
      title: ogTitle,
      description,
      url,
      siteName: 'Cricket Pulse',
      locale: 'en_IN',
      type: 'website',
      images: [{ url: `${site}/og.svg`, width: 1200, height: 630, alt: teams }],
    },
    twitter: {
      card: 'summary_large_image',
      title: ogTitle,
      description,
      images: [`${site}/og.svg`],
    },
  }
}

export default async function MatchPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const { data, bbb, squads, odds } = await loadMatch(id)
  if (!data) notFound()

  const site = getSiteUrl()
  const fmt = data.matchType?.toUpperCase() ?? 'MATCH'
  const live = data.matchStarted && !data.matchEnded
  const series = seriesOf(data.name)
  const innings = data.scorecard ?? []
  const hasScorecard = innings.some((i) => i.batting?.length)
  const c0 = teamColor(data.teamInfo?.[0]?.shortname, data.teams[0])
  const c1 = teamColor(data.teamInfo?.[1]?.shortname, data.teams[1])
  const chipColor = (inning: string) =>
    inning.toLowerCase().includes((data.teams[0] ?? '').toLowerCase().split(' ')[0]) ? c0 : c1

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'SportsEvent',
    name: data.teams.join(' vs '),
    description: data.status,
    startDate: data.dateTimeGMT ?? data.date,
    eventStatus: live
      ? 'https://schema.org/EventInProgress'
      : data.matchEnded
        ? 'https://schema.org/EventCompleted'
        : 'https://schema.org/EventScheduled',
    location: { '@type': 'Place', name: data.venue },
    url: `${site}/match/${id}`,
    sport: 'Cricket',
    competitor: [
      { '@type': 'SportsTeam', name: data.teams[0] },
      { '@type': 'SportsTeam', name: data.teams[1] },
    ],
    organizer: { '@type': 'Organization', name: 'Cricket Pulse', url: site },
  }

  const batShort = data.teamInfo?.[data.score && data.score.length > 1 ? 1 : 0]?.shortname
    ?? data.teams[data.score && data.score.length > 1 ? 1 : 0]?.split(' ').map((w) => w[0]).join('').slice(0, 3)
    ?? 'BAT'
  const active = data.score?.[data.score.length - 1]
  const ballsFaced = bbb.length || (active ? Math.floor(active.o) * 6 + Math.round((active.o % 1) * 10) : 0)
  const scoreLine = active ? `${batShort} ${active.r}-${active.w} (${ballsFaced} b)` : undefined

  // Live Line: last ball + rates only. Hero already has score/status; Scorecard has batters.
  const liveContent = (
    <div className="m-live">
      {live && bbb.length > 0 ? <LastBallBanner bbb={bbb} scoreLine={scoreLine} /> : null}
      <OddsPanel matchId={id} initial={odds} />
      {hasScorecard ? <ChaseStrip data={data} /> : (
        <div className="empty-state"><p className="empty-title">{data.status}</p><p className="empty-sub">Live line updates when play begins.</p></div>
      )}
      <AdSlot id={`match-${id}-live`} format="rectangle" />
    </div>
  )

  const histOdds = odds ?? (live ? synthRatesBoard(data, bbb) : null)
  const historyContent = live ? (
    <>
      <MatchHistory
        bbb={bbb}
        odds={histOdds}
        battingLabel={batShort}
        scoreLine={scoreLine}
        matchType={data.matchType}
      />
      <AdSlot id={`match-${id}-history`} format="rectangle" />
    </>
  ) : null

  const info = (
    <div className="m-info">
      <table className="m-info-table">
        <tbody>
          <tr><td>Match</td><td>{data.name}</td></tr>
          <tr><td>Series</td><td>{series || '—'}</td></tr>
          <tr><td>Format</td><td>{fmt}</td></tr>
          {data.tossWinner && <tr><td>Toss</td><td>{data.tossWinner} chose to {data.tossChoice}</td></tr>}
          <tr><td>Venue</td><td>{data.venue}</td></tr>
          <tr><td>Date</td><td>{data.date}</td></tr>
          <tr><td>Status</td><td>{data.status}</td></tr>
        </tbody>
      </table>
    </div>
  )

  const tabs: MatchTab[] = [
    { key: 'live', label: live ? 'Live Line' : 'Summary', content: liveContent },
    ...(live && historyContent
      ? [{ key: 'history', label: 'History', content: historyContent } as MatchTab]
      : []),
    { key: 'scorecard', label: 'Scorecard', content: <Scorecard innings={innings} /> },
    { key: 'squads', label: 'Squad', content: <Squads squads={squads} /> },
    { key: 'info', label: 'Info', content: info },
  ]

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <PageRefresher intervalMs={15_000} />
      <SiteHeader />
      <div className="container match-page">
        <Breadcrumbs items={[
          { name: 'Home', href: '/' },
          { name: 'Matches', href: '/matches' },
          { name: data.teams.join(' v '), href: `/match/${id}` },
        ]} />

        <div className="match-hero">
          <span className="match-hero-accent" style={{ background: `linear-gradient(90deg, ${c0} 0 50%, ${c1} 50% 100%)` }} aria-hidden />
          <div className="match-hero-top">
            <span className="badge-fmt">{fmt}</span>
            {live ? <span className="badge-live">● LIVE</span> : data.matchEnded ? <span className="badge-status">RESULT</span> : <span className="badge-status">UPCOMING</span>}
            {series && <span className="match-hero-series">{series}</span>}
          </div>
          <h1>
            <span className="hero-team"><span className="hero-team-dot" style={{ background: c0 }} />{data.teams[0]}</span>
            <span className="hero-vs">vs</span>
            <span className="hero-team"><span className="hero-team-dot" style={{ background: c1 }} />{data.teams[1]}</span>
          </h1>
          <div className="match-hero-scores">
            {data.score?.map((s, i) => (
              <div key={i} className="hero-score-chip" style={{ borderLeft: `3px solid ${chipColor(s.inning)}` }}>
                <span className="hero-inn">{s.inning.replace(/ inning.*$/i, '')}</span>
                <span className="hero-runs">{s.r}/{s.w} <small>({s.o})</small></span>
              </div>
            ))}
          </div>
          <p className="match-hero-status">{data.status}</p>
          <p className="match-meta">{data.venue} · {data.date}</p>
        </div>

        <MatchTabs tabs={tabs} />
        <AdSlot id={`match-${id}-bottom`} format="leaderboard" />
      </div>
    </>
  )
}
