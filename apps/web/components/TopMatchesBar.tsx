'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import type { Match } from '@/lib/api'
import { getPublicApiUrl } from '@/lib/apiUrl'

const API = getPublicApiUrl()

function teamLine(m: Match, i: number): string {
  const short = m.teamInfo?.[i]?.shortname ?? m.teams[i]?.split(' ').map((w) => w[0]).join('').slice(0, 3).toUpperCase() ?? '?'
  const key = m.teams[i]?.toLowerCase().split(' ')[0] ?? ''
  const s = m.score?.find((x) => x.inning.toLowerCase().includes(key))
  return s ? `${short} ${s.r}/${s.w}` : short
}

export function TopMatchesBar() {
  const [matches, setMatches] = useState<Match[]>([])

  useEffect(() => {
    let alive = true
    const load = async () => {
      try {
        let res = await fetch(`${API}/matches/live`, { cache: 'no-store' }).then((r) => r.json())
        let list: Match[] = res?.success && res.data?.length ? res.data : []
        if (!list.length) {
          res = await fetch(`${API}/matches/recent`, { cache: 'no-store' }).then((r) => r.json())
          list = res?.success ? (res.data ?? []) : []
        }
        if (alive) setMatches(list.slice(0, 12))
      } catch { /* ignore */ }
    }
    load()
    const t = setInterval(load, 20_000)
    return () => { alive = false; clearInterval(t) }
  }, [])

  if (!matches.length) return null

  return (
    <div className="topbar" aria-label="Top matches">
      <div className="topbar-track">
        {matches.map((m) => {
          const live = m.matchStarted && !m.matchEnded
          return (
            <Link key={m.id} href={`/match/${m.id}`} className="topbar-chip">
              <span className="topbar-fmt">{live && <span className="topbar-dot" />}{(m.matchType ?? '').toUpperCase() || 'MATCH'}</span>
              <span className="topbar-teams">{teamLine(m, 0)} <i>v</i> {teamLine(m, 1)}</span>
              <span className="topbar-status">{m.status}</span>
            </Link>
          )
        })}
      </div>
    </div>
  )
}
