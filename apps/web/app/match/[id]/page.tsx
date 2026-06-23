import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { Commentary } from '@/components/Commentary'
import { LiveSummary } from '@/components/LiveSummary'
import { MatchTabs, type MatchTab } from '@/components/MatchTabs'
import { PredictionPoll } from '@/components/PredictionPoll'
import { PageRefresher } from '@/components/PageRefresher'
import { Scorecard } from '@/components/Scorecard'
import { SiteFooter } from '@/components/SiteFooter'
import { SiteHeader } from '@/components/SiteHeader'
import { Squads } from '@/components/Squads'
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

  const summary = (
    <div className="m-summary">
      {live && hasScorecard && <LiveSummary data={data} bbb={bbb} />}
      {data.teams.length >= 2 && <PredictionPoll matchId={id} teams={[data.teams[0], data.teams[1]]} />}
      {bbb.length > 0 && (<><h3 className="m-sub">Recent overs</h3><Commentary bbb={bbb} /></>)}
      {!live && !hasScorecard && (
        <div className="empty-state"><p className="empty-title">{data.status}</p><p className="empty-sub">Scorecard and commentary appear once play begins.</p></div>
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
    { key: 'summary', label: live ? 'Live' : 'Summary', content: summary },
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
        <Link href="/matches" className="back-link">← All matches</Link>

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
