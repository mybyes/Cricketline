import type { Metadata } from 'next'
import { MatchGrid } from '@/components/MatchGrid'
import { PortalLayout } from '@/components/PortalLayout'
import { getSeriesTableFull } from '@/lib/api'

export const revalidate = 300

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params
  const { data } = await getSeriesTableFull(id)
  const name = data?.seriesName ?? 'Series'
  return {
    title: `${name} — Standings, Fixtures & Results | LiveLine Guru`,
    description: `${name} points table, fixtures and results.`,
    alternates: { canonical: `/series/${id}` },
  }
}

export default async function SeriesDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const { data } = await getSeriesTableFull(id)
  const standings = data?.standings ?? []
  const matches = data?.matches ?? []

  return (
    <PortalLayout
      title={data?.seriesName ?? 'Series'}
      subtitle="Standings, fixtures & results"
      crumbs={[{ name: 'Home', href: '/' }, { name: 'Series', href: '/series' }, { name: data?.seriesName ?? 'Series', href: `/series/${id}` }]}
    >
      {standings.length > 0 && (
        <>
          <h2 className="section-title">Points table</h2>
          <div className="table-wrap">
            <table>
              <thead>
                <tr><th className="ta-left">Team</th><th>M</th><th>W</th><th>L</th><th>Pts</th></tr>
              </thead>
              <tbody>
                {standings.map((r) => (
                  <tr key={r.team}>
                    <td className="ta-left">{r.team}</td>
                    <td>{r.m}</td><td>{r.w}</td><td>{r.l}</td><td className="bold">{r.pts}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}

      {Boolean(data?.topRuns?.length || data?.topWickets?.length) && (
        <>
          <h2 className="section-title">Series stats</h2>
          <div className="series-stats">
            {data?.topRuns?.length ? (
              <div className="stat-card">
                <div className="stat-card-head">Most runs</div>
                <ol className="stat-list">
                  {data.topRuns.map((p) => (
                    <li key={p.name}><span className="stat-name">{p.name}</span><span className="stat-val">{p.runs} <small>({p.balls}b)</small></span></li>
                  ))}
                </ol>
              </div>
            ) : null}
            {data?.topWickets?.length ? (
              <div className="stat-card">
                <div className="stat-card-head">Most wickets</div>
                <ol className="stat-list">
                  {data.topWickets.map((p) => (
                    <li key={p.name}><span className="stat-name">{p.name}</span><span className="stat-val">{p.wkts} <small>({p.runs}r)</small></span></li>
                  ))}
                </ol>
              </div>
            ) : null}
          </div>
        </>
      )}

      <h2 className="section-title">Matches</h2>
      <MatchGrid matches={matches} empty="No matches listed for this series yet" />
    </PortalLayout>
  )
}
