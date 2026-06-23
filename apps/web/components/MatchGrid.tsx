import Link from 'next/link'
import type { Match } from '@/lib/api'
import { MatchCard } from './MatchCard'

export function MatchGrid({ matches, showTime, empty }: { matches: Match[]; showTime?: boolean; empty?: string }) {
  if (!matches.length) {
    return (
      <div className="empty-state">
        <p className="empty-title">{empty ?? 'Nothing here right now'}</p>
        <p className="empty-sub">Check back soon — fixtures update through the day.</p>
      </div>
    )
  }
  return (
    <div className="match-grid">
      {matches.map((m) => (
        <Link key={m.id} href={`/match/${m.id}`} className="match-grid-link">
          <MatchCard match={m} showTime={showTime} />
        </Link>
      ))}
    </div>
  )
}
