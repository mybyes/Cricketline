'use client'

import { useMemo, useState } from 'react'
import type { Match } from '@/lib/api'
import { MatchGrid } from './MatchGrid'

export function FilterableMatches({
  matches, showTime, placeholder = 'Search team, series or venue…',
}: { matches: Match[]; showTime?: boolean; placeholder?: string }) {
  const [q, setQ] = useState('')

  const filtered = useMemo(() => {
    const term = q.trim().toLowerCase()
    if (!term) return matches
    return matches.filter((m) =>
      `${m.name} ${m.teams.join(' ')} ${m.venue}`.toLowerCase().includes(term),
    )
  }, [q, matches])

  return (
    <>
      <div className="fixture-filter">
        <input
          type="search"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder={placeholder}
          aria-label="Filter fixtures"
        />
        {q && <span className="fixture-filter-count">{filtered.length} of {matches.length}</span>}
      </div>
      <MatchGrid matches={filtered} showTime={showTime} empty={q ? `No fixtures match “${q}”` : 'No fixtures listed'} />
    </>
  )
}
