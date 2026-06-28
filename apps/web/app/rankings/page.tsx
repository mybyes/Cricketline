import type { Metadata } from 'next'
import { PortalLayout } from '@/components/PortalLayout'
import { AdSlot } from '@/components/AdSlot'
import { getRankings, type PlayerRank, type RankRow } from '@/lib/api'

export const revalidate = 3600

export const metadata: Metadata = {
  title: 'ICC Cricket Rankings — Teams & Players (Test, ODI, T20) | LiveLine Guru',
  description: 'Latest ICC cricket rankings for teams and players across Test, ODI and T20 formats.',
  alternates: { canonical: '/rankings' },
}

const FORMATS = [
  { key: 'test' as const, label: 'Test' },
  { key: 'odi' as const, label: 'ODI' },
  { key: 't20' as const, label: 'T20I' },
]

function TeamTable({ rows }: { rows: RankRow[] }) {
  return (
    <div className="table-wrap rank-table">
      <table>
        <thead><tr><th>#</th><th className="ta-left">Team</th><th>Rating</th></tr></thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.team} className={r.rank === 1 ? 'rank-top' : ''}>
              <td className="bold">{r.rank}</td>
              <td className="ta-left">{r.team} <span className="rank-short">{r.short}</span></td>
              <td className="bold">{r.rating}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

function PlayerList({ title, rows }: { title: string; rows: PlayerRank[] }) {
  return (
    <div className="rank-players">
      <h4 className="rank-players-title">{title}</h4>
      <ol className="rank-player-list">
        {rows.map((p) => (
          <li key={p.name}><span className="rp-rank">{p.rank}</span><span className="rp-name">{p.name}</span><span className="rp-team">{p.team}</span><span className="rp-rating">{p.rating}</span></li>
        ))}
      </ol>
    </div>
  )
}

export default async function RankingsPage() {
  const { data } = await getRankings()
  if (!data?.teams) {
    return <PortalLayout title="ICC Rankings"><div className="empty-state"><p className="empty-title">Rankings unavailable</p></div></PortalLayout>
  }

  return (
    <PortalLayout title="ICC Rankings" subtitle={`Teams & players · updated ${data.updated}`}>
      {FORMATS.map((f, i) => (
        <section key={f.key} className="rank-section">
          <h2 className="section-title">{f.label} rankings</h2>
          <TeamTable rows={data.teams[f.key]} />
          <div className="rank-players-grid">
            <PlayerList title={`Top ${f.label} batters`} rows={data.batters[f.key]} />
            <PlayerList title={`Top ${f.label} bowlers`} rows={data.bowlers[f.key]} />
          </div>
          {i === 0 && <AdSlot id="rankings-inline" format="rectangle" />}
        </section>
      ))}
    </PortalLayout>
  )
}
