import type { Metadata } from 'next'
import { MatchGrid } from '@/components/MatchGrid'
import { PortalLayout } from '@/components/PortalLayout'
import { getLiveMatches } from '@/lib/api'

export const revalidate = 15

export const metadata: Metadata = {
  title: 'Live Cricket Scores — Ball by Ball | LiveLine Guru',
  description: 'Live cricket scores and ball-by-ball updates for all ongoing matches — IPL, Tests, ODIs and T20.',
  alternates: { canonical: '/live' },
}

export default async function LivePage() {
  const { data } = await getLiveMatches()
  return (
    <PortalLayout title="Live Scores" subtitle={`${data.length} match${data.length === 1 ? '' : 'es'} live now`} refresh>
      <MatchGrid matches={data} empty="No live matches right now" />
    </PortalLayout>
  )
}
