import type { Metadata } from 'next'
import { MatchGrid } from '@/components/MatchGrid'
import { PortalLayout } from '@/components/PortalLayout'
import { AdSlot } from '@/components/AdSlot'
import { getLiveMatches, getRecentMatches, getUpcomingMatches } from '@/lib/api'

export const revalidate = 30

export const metadata: Metadata = {
  title: 'All Cricket Matches — Live, Upcoming & Results | CricketFast',
  description: 'Every cricket match in one place — live scores, upcoming fixtures and recent results across all formats.',
  alternates: { canonical: '/matches' },
}

export default async function MatchesPage() {
  const [live, upcoming, recent] = await Promise.all([getLiveMatches(), getUpcomingMatches(), getRecentMatches()])
  return (
    <PortalLayout title="Matches" subtitle="Live, upcoming and recent — all formats" refresh>
      <h2 className="section-title">Live now</h2>
      <MatchGrid matches={live.data} empty="No live matches right now" />

      <AdSlot id="matches-inline" format="rectangle" />

      <h2 className="section-title">Upcoming</h2>
      <MatchGrid matches={upcoming.data} showTime empty="No upcoming fixtures" />

      <h2 className="section-title">Recent results</h2>
      <MatchGrid matches={recent.data} showTime empty="No recent results" />
    </PortalLayout>
  )
}
