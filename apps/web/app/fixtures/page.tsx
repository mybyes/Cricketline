import type { Metadata } from 'next'
import { FilterableMatches } from '@/components/FilterableMatches'
import { PortalLayout } from '@/components/PortalLayout'
import { getUpcomingMatches } from '@/lib/api'

export const revalidate = 120

export const metadata: Metadata = {
  title: 'Cricket Fixtures & Schedule — Upcoming Matches | CricketFast',
  description: 'Upcoming cricket fixtures and full match schedule across IPL, internationals and T20 leagues.',
  alternates: { canonical: '/fixtures' },
}

export default async function FixturesPage() {
  const { data } = await getUpcomingMatches()
  return (
    <PortalLayout title="Fixtures" subtitle="Upcoming matches & schedule">
      <FilterableMatches matches={data} showTime />
    </PortalLayout>
  )
}
