import type { Metadata } from 'next'
import { MatchGrid } from '@/components/MatchGrid'
import { PortalLayout } from '@/components/PortalLayout'
import { getRecentMatches } from '@/lib/api'

export const revalidate = 120

export const metadata: Metadata = {
  title: 'Cricket Results & Recent Scores | LiveLine Guru',
  description: 'Recent cricket results and completed match scorecards — IPL, Tests, ODIs and T20.',
  alternates: { canonical: '/results' },
}

export default async function ResultsPage() {
  const { data } = await getRecentMatches()
  return (
    <PortalLayout title="Results" subtitle="Recent completed matches">
      <MatchGrid matches={data} showTime empty="No recent results yet" />
    </PortalLayout>
  )
}
