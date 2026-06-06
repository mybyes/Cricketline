import Link from 'next/link'
import { notFound } from 'next/navigation'
import { AppDownloadButton } from '@/components/AppDownloadButton'
import { PageRefresher } from '@/components/PageRefresher'
import { SiteFooter } from '@/components/SiteFooter'
import { SiteHeader } from '@/components/SiteHeader'

const API = process.env.API_URL ?? process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3000'

export const revalidate = 12

async function getScore(id: string) {
  try {
    const res = await fetch(`${API}/match/${id}/score`, { next: { revalidate: 12 } })
    const body = await res.json()
    if (!body.success) return null
    return body.data as {
      id: string; name: string; status: string; venue: string; date: string
      teams: string[]; matchType: string; score: { r: number; w: number; o: number; inning: string }[]
      teamInfo: { shortname: string; img: string }[]
      tossWinner?: string; tossChoice?: string
      matchStarted: boolean; matchEnded: boolean
    }
  } catch {
    return null
  }
}

export default async function MatchPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const data = await getScore(id)
  if (!data) notFound()

  const fmt = data.matchType?.toUpperCase() ?? 'MATCH'
  const live = data.matchStarted && !data.matchEnded

  return (
    <>
      <PageRefresher intervalMs={15_000} />
      <SiteHeader />
      <div className="container match-page">
        <Link href="/" className="back-link">← All matches</Link>

        <div className="match-hero">
          <div className="match-hero-top">
            <span className="badge-fmt">{fmt}</span>
            {live && <span className="badge-live">LIVE</span>}
          </div>
          <h1>{data.teams.join(' vs ')}</h1>
          <p className="match-hero-status">{data.status}</p>
          <div className="match-hero-scores">
            {data.score?.map((s, i) => (
              <div key={i} className="hero-score-chip">
                <span className="hero-inn">{s.inning}</span>
                <span className="hero-runs">{s.r}/{s.w} ({s.o})</span>
              </div>
            ))}
          </div>
          {data.tossWinner && (
            <p className="match-meta">Toss: {data.tossWinner} chose to {data.tossChoice}</p>
          )}
          <p className="match-meta">{data.venue} · {data.date}</p>
        </div>

        <div className="app-cta-box">
          <strong>Open in CricketFast App</strong>
          <p>Live line · Session · Rates · Squad · History · Points table — 8 dedicated tabs</p>
          <AppDownloadButton label="Get Android App" comingSoonLabel="Android — coming soon" />
        </div>

        <p className="match-note">Full scorecard, ball-by-ball and squad available in the mobile app.</p>
      </div>
      <SiteFooter />
    </>
  )
}
