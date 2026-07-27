import type { Metadata } from 'next'
import { MatchGrid } from '@/components/MatchGrid'
import { PortalLayout } from '@/components/PortalLayout'
import { getLiveMatches } from '@/lib/api'

export const revalidate = 15

export const metadata: Metadata = {
  title: 'Live cricket scores',
  description: 'Live cricket scores and match insights for ongoing games — IPL, Tests, ODIs and T20.',
  alternates: { canonical: '/live' },
  openGraph: {
    title: 'Live cricket scores | Cricket Pulse',
    description: 'All ongoing matches with live scores and smart insights.',
    url: '/live',
    type: 'website',
  },
}

export default async function LivePage() {
  const { data } = await getLiveMatches()
  return (
    <PortalLayout title="Live Scores" subtitle="Ongoing matches" refresh>
      <MatchGrid matches={data} empty="No live matches right now" />
    </PortalLayout>
  )
}
