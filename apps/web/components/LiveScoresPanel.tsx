'use client'

import { useCallback, useEffect, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import type { Match } from '@/lib/api'

const API = process.env.NEXT_PUBLIC_API_URL ?? ''

type Tab = 'live' | 'recent' | 'upcoming'

export interface LiveScoresInitial {
  live: Match[]
  recent: Match[]
  upcoming: Match[]
  stale?: boolean
  error?: string
}

async function fetchMatches(path: string): Promise<{ data: Match[]; stale: boolean; error?: string }> {
  if (!API) return { data: [], stale: false, error: 'NEXT_PUBLIC_API_URL not set on Vercel' }
  try {
    const res = await fetch(`${API}${path}`, { cache: 'no-store' })
    const body = await res.json()
    if (body.success && Array.isArray(body.data)) {
      return { data: body.data, stale: !!body.stale, error: body.error }
    }
    return { data: [], stale: false, error: body.error ?? `HTTP ${res.status}` }
  } catch (e: unknown) {
    return { data: [], stale: false, error: e instanceof Error ? e.message : 'Network error' }
  }
}

function WebMatchCard({ match }: { match: Match }) {
  const live = match.matchStarted && !match.matchEnded
  const fmt = (match.matchType ?? 'match').toUpperCase()
  const scores = match.score ?? []
  const t0 = match.teams[0]?.toLowerCase().split(' ')[0] ?? ''
  const t1 = match.teams[1]?.toLowerCase().split(' ')[0] ?? ''
  const s0 = scores.find((s) => s.inning.toLowerCase().includes(t0))
  const s1 = scores.find((s) => s.inning.toLowerCase().includes(t1))
  const fmtScore = (s?: { r: number; w: number; o: number }) => (s ? `${s.r}-${s.w} (${s.o})` : '—')

  return (
    <Link href={`/match/${match.id}`} className={`w-match ${live ? 'w-match-live' : ''}`}>
      <div className="w-match-top">
        <span className="w-match-fmt">{live ? `LIVE · ${fmt}` : fmt}</span>
        <span className="w-match-badge">{live ? 'LIVE' : match.matchEnded ? 'RESULT' : 'UPCOMING'}</span>
      </div>
      <div className="w-match-teams">
        <div className="w-team">
          {match.teamInfo?.[0]?.img && (
            <Image src={match.teamInfo[0].img} alt="" className="w-logo" width={36} height={36} unoptimized />
          )}
          <div>
            <div className="w-short">{match.teamInfo?.[0]?.shortname ?? match.teams[0]}</div>
            <div className="w-full">{match.teams[0]}</div>
          </div>
          <div className="w-score">{fmtScore(s0)}</div>
        </div>
        <div className="w-vs">VS</div>
        <div className="w-team w-team-r">
          <div className="w-score">{fmtScore(s1)}</div>
          <div className="w-team-r-text">
            <div className="w-short">{match.teamInfo?.[1]?.shortname ?? match.teams[1]}</div>
            <div className="w-full">{match.teams[1]}</div>
          </div>
          {match.teamInfo?.[1]?.img && (
            <Image src={match.teamInfo[1].img} alt="" className="w-logo" width={36} height={36} unoptimized />
          )}
        </div>
      </div>
      {scores.length > 2 && (
        <div className="w-innings-extra">
          {scores.map((s, i) => (
            <span key={i} className="w-inn-chip">{s.inning}: {s.r}/{s.w}</span>
          ))}
        </div>
      )}
      <div className={`w-status ${live ? 'w-status-live' : ''}`}>{live ? '● ' : ''}{match.status}</div>
      <div className="w-meta">
        <span>{match.name.split(',').pop()?.trim() ?? fmt}</span>
        <span>{match.venue}</span>
      </div>
    </Link>
  )
}

export function LiveScoresPanel({ initial }: { initial?: LiveScoresInitial }) {
  const [tab, setTab] = useState<Tab>('live')
  const [live, setLive] = useState<Match[]>(initial?.live ?? [])
  const [recent, setRecent] = useState<Match[]>(initial?.recent ?? [])
  const [upcoming, setUpcoming] = useState<Match[]>(initial?.upcoming ?? [])
  const [stale, setStale] = useState(initial?.stale ?? false)
  const [error, setError] = useState<string | undefined>(initial?.error)

  const load = useCallback(async () => {
    const [l, r, u] = await Promise.all([
      fetchMatches('/matches/live'),
      fetchMatches('/matches/recent'),
      fetchMatches('/matches/upcoming'),
    ])
    setLive(l.data)
    setRecent(r.data)
    setUpcoming(u.data)
    setStale(l.stale || r.stale || u.stale)
    setError(l.error && !l.data.length ? l.error : undefined)
  }, [])

  useEffect(() => {
    const id = setInterval(load, 15_000)
    return () => clearInterval(id)
  }, [load])

  const list = tab === 'live' ? live : tab === 'recent' ? recent : upcoming
  const label = tab === 'live' ? 'live' : tab === 'recent' ? 'recent' : 'upcoming'

  return (
    <div className="live-panel" id="fixtures">
      {stale && (
        <div className="alert-banner alert-stale">⏳ Cached scores — API rate limited. Refreshing every 15s.</div>
      )}
      {error && (
        <div className="alert-banner alert-error">⚠ {error}</div>
      )}

      <div className="tab-row">
        {(['live', 'recent', 'upcoming'] as Tab[]).map((t) => (
          <button
            key={t}
            type="button"
            className={`tab-btn ${tab === t ? 'tab-btn-on' : ''}`}
            onClick={() => setTab(t)}
          >
            {t === 'live' ? `Live (${live.length})` : t === 'recent' ? `Results (${recent.length})` : `Fixtures (${upcoming.length})`}
          </button>
        ))}
      </div>

      {list.length === 0 ? (
        <div className="empty-state">No {label} matches loaded. Check API_URL on Vercel or wait for CricAPI.</div>
      ) : (
        <div className="match-list">
          {list.map((m) => <WebMatchCard key={m.id} match={m} />)}
        </div>
      )}
    </div>
  )
}
