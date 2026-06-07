'use client'

import { useCallback, useEffect, useState } from 'react'
import Link from 'next/link'
import type { Match } from '@/lib/api'
import { getPublicApiUrl } from '@/lib/apiUrl'
import { TeamBadge } from './TeamBadge'

const API = getPublicApiUrl()

type Tab = 'live' | 'recent' | 'upcoming'

export interface LiveScoresInitial {
  live: Match[]
  recent: Match[]
  upcoming: Match[]
  stale?: boolean
  error?: string
}

async function fetchMatches(path: string): Promise<{ data: Match[]; stale: boolean; error?: string }> {
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

function fmtScore(s?: { r: number; w: number; o: number }) {
  return s ? `${s.r}/${s.w} (${s.o})` : '—'
}

function matchContext(match: Match): string | null {
  const live = match.matchStarted && !match.matchEnded
  if (!live || !match.score?.length) return null
  const fmt = (match.matchType ?? '').toUpperCase()
  const last = match.score[match.score.length - 1]
  const chasing = match.status.match(/need (\d+)/i)
  if (chasing) return `${fmt} · Need ${chasing[1]} more`
  return fmt ? `${fmt} · ${last.r}/${last.w} (${last.o} ov)` : null
}

function WebMatchCard({ match }: { match: Match }) {
  const live = match.matchStarted && !match.matchEnded
  const fmt = (match.matchType ?? 'match').toUpperCase()
  const scores = match.score ?? []
  const t0 = match.teams[0]?.toLowerCase().split(' ')[0] ?? ''
  const t1 = match.teams[1]?.toLowerCase().split(' ')[0] ?? ''
  const s0 = scores.find((s) => s.inning.toLowerCase().includes(t0))
  const s1 = scores.find((s) => s.inning.toLowerCase().includes(t1))
  const ctx = matchContext(match)
  const series = match.name.split(',').pop()?.trim()

  return (
    <Link href={`/match/${match.id}`} className={`w-match ${live ? 'w-match-live' : ''}`}>
      <div className="w-match-head">
        <div className="w-match-head-left">
          {live && <span className="w-live-dot" aria-hidden />}
          <span className="w-match-fmt">{fmt}</span>
          {ctx && <span className="w-match-ctx">{ctx}</span>}
        </div>
        <span className={`w-match-badge ${live ? 'w-badge-live' : match.matchEnded ? 'w-badge-result' : 'w-badge-up'}`}>
          {live ? 'LIVE' : match.matchEnded ? 'RESULT' : 'UPCOMING'}
        </span>
      </div>

      <div className="w-match-body">
        <div className="w-side">
          <TeamBadge shortname={match.teamInfo?.[0]?.shortname} name={match.teams[0]} img={match.teamInfo?.[0]?.img} />
          <div className="w-side-text">
            <span className="w-short">{match.teamInfo?.[0]?.shortname ?? match.teams[0]}</span>
            <span className="w-score">{fmtScore(s0)}</span>
          </div>
        </div>

        <span className="w-vs">vs</span>

        <div className="w-side w-side-r">
          <div className="w-side-text w-side-text-r">
            <span className="w-short">{match.teamInfo?.[1]?.shortname ?? match.teams[1]}</span>
            <span className="w-score">{fmtScore(s1)}</span>
          </div>
          <TeamBadge shortname={match.teamInfo?.[1]?.shortname} name={match.teams[1]} img={match.teamInfo?.[1]?.img} />
        </div>
      </div>

      <p className={`w-status ${live ? 'w-status-live' : ''}`}>{match.status}</p>

      <div className="w-meta">
        <span>{series ?? fmt}</span>
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
    const empty = !l.data.length && !r.data.length && !u.data.length
    setError(empty ? (l.error ?? r.error ?? u.error) : undefined)
  }, [])

  useEffect(() => {
    const id = setInterval(load, 15_000)
    return () => clearInterval(id)
  }, [load])

  const list = tab === 'live' ? live : tab === 'recent' ? recent : upcoming
  const label = tab === 'live' ? 'live' : tab === 'recent' ? 'recent' : 'upcoming'
  const liveCount = live.filter((m) => m.matchStarted && !m.matchEnded).length

  return (
    <div className="live-panel" id="fixtures">
      {liveCount > 0 && tab === 'live' && (
        <div className="live-bar">
          <span className="live-dot" />
          <span>{liveCount} match{liveCount === 1 ? '' : 'es'} live now</span>
          <span className="live-bar-hint">Updates every 15s</span>
        </div>
      )}

      {stale && (
        <div className="alert-banner alert-stale">Cached scores — refreshing automatically.</div>
      )}
      {error && (
        <div className="alert-banner alert-error">{error}</div>
      )}

      <div className="tab-row" role="tablist">
        {(['live', 'recent', 'upcoming'] as Tab[]).map((t) => (
          <button
            key={t}
            type="button"
            role="tab"
            aria-selected={tab === t}
            className={`tab-btn ${tab === t ? 'tab-btn-on' : ''}`}
            onClick={() => setTab(t)}
          >
            {t === 'live' ? `Live (${live.length})` : t === 'recent' ? `Results (${recent.length})` : `Fixtures (${upcoming.length})`}
          </button>
        ))}
      </div>

      {list.length === 0 ? (
        <div className="empty-state">
          <p className="empty-title">No {label} matches right now</p>
          <p className="empty-sub">
            {tab === 'live'
              ? 'Check Results or Fixtures — or come back when a match is in progress.'
              : 'Scores will appear here once the API has data for this tab.'}
          </p>
        </div>
      ) : (
        <div className="match-list">
          {list.map((m) => <WebMatchCard key={m.id} match={m} />)}
        </div>
      )}
    </div>
  )
}
