import type { Metadata } from 'next'
import Link from 'next/link'
import { MatchGrid } from '@/components/MatchGrid'
import { PortalLayout } from '@/components/PortalLayout'
import { search } from '@/lib/api'

export const dynamic = 'force-dynamic'

export async function generateMetadata({ searchParams }: { searchParams: Promise<{ q?: string }> }): Promise<Metadata> {
  const { q } = await searchParams
  const title = q ? `Search: ${q} | LiveLine Guru` : 'Search | LiveLine Guru'
  return { title, description: 'Search live cricket scores, teams, series and matches.', robots: { index: false } }
}

export default async function SearchPage({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  const { q = '' } = await searchParams
  const query = q.trim()
  const res = query.length >= 2 ? await search(query) : null
  const data = res?.data
  const empty = !data || (!data.matches?.length && !data.teams?.length && !data.series?.length)

  return (
    <PortalLayout title={query ? `Results for “${query}”` : 'Search'} subtitle="Teams, series & matches">
      {query.length < 2 ? (
        <div className="empty-state">
          <p className="empty-title">Type at least 2 characters</p>
          <p className="empty-sub">Search for a team, series, venue or match.</p>
        </div>
      ) : empty ? (
        <div className="empty-state">
          <p className="empty-title">No results for “{query}”</p>
          <p className="empty-sub">Try a team name like “India” or a series like “IPL”.</p>
        </div>
      ) : (
        <>
          {data!.teams.length > 0 && (
            <>
              <h2 className="section-title">Teams</h2>
              <div className="search-chips">
                {data!.teams.map((t) => (
                  <Link key={t.name} href={`/team/${encodeURIComponent(t.name)}`} className="search-chip">
                    <span className="search-chip-badge">{t.short}</span>{t.name}
                  </Link>
                ))}
              </div>
            </>
          )}
          {data!.series.length > 0 && (
            <>
              <h2 className="section-title">Series</h2>
              <div className="search-chips">
                {data!.series.map((s) => (
                  <Link key={s.id} href={`/series/${s.id}`} className="search-chip">{s.name}</Link>
                ))}
              </div>
            </>
          )}
          {data!.matches.length > 0 && (
            <>
              <h2 className="section-title">Matches</h2>
              <MatchGrid matches={data!.matches} showTime />
            </>
          )}
        </>
      )}
    </PortalLayout>
  )
}
