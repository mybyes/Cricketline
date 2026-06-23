import type { Metadata } from 'next'
import Link from 'next/link'
import { PortalLayout } from '@/components/PortalLayout'
import { FALLBACK_SERIES, getSeriesList } from '@/lib/api'

export const revalidate = 300

export const metadata: Metadata = {
  title: 'Cricket Series & Tournaments | CricketFast',
  description: 'Browse current and upcoming cricket series and tournaments — standings, fixtures and results.',
  alternates: { canonical: '/series' },
}

export default async function SeriesPage() {
  const res = await getSeriesList()
  const series = res.data?.length ? res.data : FALLBACK_SERIES

  return (
    <PortalLayout title="Series" subtitle="Tournaments, bilateral series & leagues">
      <div className="series-grid">
        {series.map((s) => (
          <Link key={s.id} href={`/series/${s.id}`} className="series-card">
            <span className="series-name">{s.name}</span>
            <span className="series-go">View standings &amp; fixtures →</span>
          </Link>
        ))}
      </div>
    </PortalLayout>
  )
}
