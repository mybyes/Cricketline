import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { Breadcrumbs } from '@/components/Breadcrumbs'
import { Commentary } from '@/components/Commentary'
import { LiveSummary } from '@/components/LiveSummary'
import { MatchTabs, type MatchTab } from '@/components/MatchTabs'
import { PredictionPoll } from '@/components/PredictionPoll'
import { PageRefresher } from '@/components/PageRefresher'
import { RatesPanel } from '@/components/RatesPanel'
import { Scorecard } from '@/components/Scorecard'
import { SessionAnalytics } from '@/components/SessionAnalytics'
import { SiteFooter } from '@/components/SiteFooter'
import { SiteHeader } from '@/components/SiteHeader'
import { Squads } from '@/components/Squads'
import { WinProbability } from '@/components/WinProbability'
import { getBallByBall, getScorecard, getSquad, type BbbBall, type ScorecardData, type SquadTeam } from '@/lib/api'
import { getSiteUrl } from '@/lib/site'

export const revalidate = 12

function seriesOf(name: string) {
  const parts = name.split(',').map((s) => s.trim())
  return parts.length >= 2 ? parts[parts.length - 1] : ''
}

async function loadMatch(id: string): Promise<{ data: ScorecardData | null; bbb: BbbBall[]; squads: SquadTeam[] }> {
  const [score, bbb, squad] = await Promise.all([getScorecard(id), getBallByBall(id), getSquad(id)])
  const data = score.data && typeof score.data === 'object' && 'teams' in score.data ? score.data : null
  return {
    data,
    bbb: Array.isArray(bbb.data) ? bbb.data : [],
    squads: Array.isArray(squad.data) ? squad.data : [],
  }
}

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params
  const { data } = await loadMatch(id)
  const site = getSiteUrl()
  if (!data) return { title: 'Match not found | CricketFast' }
  const teams = data.teams.join(' vs ')
  const scoreStr = data.score?.map((s) => `${s.r}/${s.w}`).join(' · ') ?? ''
  const title = `${teams} — Live Score, Scorecard & Commentary | CricketFast`
  const description = `${data.status}${scoreStr ? `. ${scoreStr}` : ''}. Full scorecard, fall of wickets, squads and stats. ${data.venue}.`
  const url = `${site}/match/${id}`
  return { title, description, alternates: { canonical: url }, openGraph: { title, description, url, siteName: 'CricketFast', locale: 'en_IN', type: 'website' } }
}

export default async function MatchPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const { data, bbb, squads } = await loadMatch(id)
  if (!data) notFound()

  const site = getSiteUrl()
  const fmt = data.matchType?.toUpperCase() ?? 'MATCH'
  const live = data.matchStarted && !data.matchEnded
  const series = seriesOf(data.name)
  const innings = data.scorecard ?? []
  const hasScorecard = innings.some((i) => i.batting?.length)

  const jsonLd = {
    '@context': 'https://schema.org', '@type': 'SportsEvent',
    name: data.teams.join(' vs '), description: data.status,
    startDate: data.dateTimeGMT ?? data.date,
    eventStatus: live ? 'https://schema.org/EventScheduled' : 'https://schema.org/EventCompleted',
    location: { '@type': 'Place', name: data.venue }, url: `${site}/match/${id}`, sport: 'Cricket',
    homeTeam: { '@type': 'SportsTeam', name: data.teams[0] }, awayTeam: { '@type': 'SportsTeam', name: data.teams[1] },
  }

  // Live tab: score summary + prediction, then Session / Rates analytics sub-tabs.
  const liveContent = (
    <div className="m-live">
      {hasScorecard && <LiveSummary data={data} bbb={bbb} />}
      {hasScorecard && <WinProbability data={data} />}
      {data.teams.length >= 2 && <PredictionPoll matchId={id} teams={[data.teams[0], data.teams[1]]} />}
      {hasScorecard ? (
        <MatchTabs tabs={[
          { key: 'session', label: 'Session', content: <SessionAnalytics innings={innings} /> },
          { key: 'rates', label: 'Rates', content: <RatesPanel data={data} /> },
        ]} />
      ) : (
        <div className="empty-state"><p className="empty-title">{data.status}</p><p className="empty-sub">Session & rate analytics appear once play begins.</p></div>
      )}
    </div>
  )

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
    { key: 'live', label: live ? 'Live' : 'Summary', content: liveContent },
    { key: 'bbb', label: 'Ball by Ball', content: <Commentary bbb={bbb} /> },
    { key: 'scorecard', label: 'Scorecard', content: <Scorecard innings={innings} /> },
    { key: 'squads', label: 'Squads', content: <Squads squads={squads} /> },
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
          <div className="match-hero-top">
            <span className="badge-fmt">{fmt}</span>
            {live ? <span className="badge-live">● LIVE</span> : data.matchEnded ? <span className="badge-status">RESULT</span> : <span className="badge-status">UPCOMING</span>}
            {series && <span className="match-hero-series">{series}</span>}
          </div>
          <h1>{data.teams.join(' vs ')}</h1>
          <div className="match-hero-scores">
            {data.score?.map((s, i) => (
              <div key={i} className="hero-score-chip">
                <span className="hero-inn">{s.inning.replace(/ inning.*$/i, '')}</span>
                <span className="hero-runs">{s.r}/{s.w} <small>({s.o})</small></span>
              </div>
            ))}
          </div>
          <p className="match-hero-status">{data.status}</p>
          <p className="match-meta">{data.venue} · {data.date}</p>
        </div>

        <MatchTabs tabs={tabs} />
      </div>
      <SiteFooter />
    </>
  )
}
