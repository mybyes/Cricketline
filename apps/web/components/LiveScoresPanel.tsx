'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import type { Match } from '@/lib/api'
import { getPublicApiUrl } from '@/lib/apiUrl'
import { staleNotice } from '@/lib/cacheTime'
import { loadHomeCache, mergeMatchList, saveHomeCache } from '@/lib/matchCache'
import { TeamBadge } from './TeamBadge'

const API = getPublicApiUrl()

type Tab = 'live' | 'recent' | 'upcoming'

export interface LiveScoresInitial {
  live: Match[]
  recent: Match[]
  upcoming: Match[]
  stale?: boolean
  cachedAt?: number
}

async function fetchMatches(path: string): Promise<{ data: Match[]; stale: boolean; cachedAt?: number }> {
  try {
    const res = await fetch(`${API}${path}`, { cache: 'no-store' })
    const body = await res.json()
    if (body.success && Array.isArray(body.data)) {
      return { data: body.data, stale: !!body.stale, cachedAt: body.cachedAt }
    }
    return { data: [], stale: true }
  } catch {
    return { data: [], stale: true }
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

function bootLists(initial?: LiveScoresInitial) {
  const disk = typeof window !== 'undefined' ? loadHomeCache() : null
  return {
    live: mergeMatchList(initial?.live ?? [], disk?.live ?? []),
    recent: mergeMatchList(initial?.recent ?? [], disk?.recent ?? []),
    upcoming: mergeMatchList(initial?.upcoming ?? [], disk?.upcoming ?? []),
    diskAt: disk?.savedAt,
  }
}

export function LiveScoresPanel({ initial }: { initial?: LiveScoresInitial }) {
  const boot = bootLists(initial)
  const [tab, setTab] = useState<Tab>('live')
  const [live, setLive] = useState<Match[]>(boot.live)
  const [recent, setRecent] = useState<Match[]>(boot.recent)
  const [upcoming, setUpcoming] = useState<Match[]>(boot.upcoming)
  const liveRef = useRef(boot.live)
  const recentRef = useRef(boot.recent)
  const upcomingRef = useRef(boot.upcoming)
  liveRef.current = live
  recentRef.current = recent
  upcomingRef.current = upcoming
  const [stale, setStale] = useState(initial?.stale ?? !!boot.diskAt)
  const [streaming, setStreaming] = useState(false)
  const [cachedLabel, setCachedLabel] = useState<string | null>(
    (initial?.stale || boot.diskAt) && (initial?.cachedAt ?? boot.diskAt)
      ? staleNotice(initial?.cachedAt ?? boot.diskAt)
      : null,
  )

  const load = useCallback(async () => {
    const [l, r, u] = await Promise.all([
      fetchMatches('/matches/live'),
      fetchMatches('/matches/recent'),
      fetchMatches('/matches/upcoming'),
    ])
    const disk = loadHomeCache()
    const nextLive = mergeMatchList(l.data, liveRef.current.length ? liveRef.current : (disk?.live ?? []))
    const nextRecent = mergeMatchList(r.data, recentRef.current.length ? recentRef.current : (disk?.recent ?? []))
    const nextUpcoming = mergeMatchList(u.data, upcomingRef.current.length ? upcomingRef.current : (disk?.upcoming ?? []))
    setLive(nextLive)
    setRecent(nextRecent)
    setUpcoming(nextUpcoming)
    if (nextLive.length || nextRecent.length || nextUpcoming.length) {
      saveHomeCache(nextLive, nextRecent, nextUpcoming)
    }
    const usedDisk = (l.data.length === 0 && nextLive.length > 0)
      || (r.data.length === 0 && nextRecent.length > 0)
      || (u.data.length === 0 && nextUpcoming.length > 0)
    const isStale = l.stale || r.stale || u.stale || usedDisk
    setStale(isStale)
    const ts = Math.max(l.cachedAt ?? 0, r.cachedAt ?? 0, u.cachedAt ?? 0, disk?.savedAt ?? 0)
    setCachedLabel(isStale && (nextLive.length + nextRecent.length + nextUpcoming.length) > 0
      ? staleNotice(ts || undefined)
      : null)
  }, [])

  useEffect(() => {
    const id = setInterval(load, 15_000)
    return () => clearInterval(id)
  }, [load])

  // Real-time push: subscribe to the SSE stream and apply live updates instantly.
  // EventSource auto-reconnects; the 15s poll above stays as a fallback.
  useEffect(() => {
    if (typeof window === 'undefined' || !('EventSource' in window)) return
    const es = new EventSource(`${API}/stream`)
    es.addEventListener('scores', (e) => {
      try {
        const body = JSON.parse((e as MessageEvent).data) as { data?: Match[] }
        if (Array.isArray(body.data) && body.data.length) {
          setLive((prev) => mergeMatchList(body.data!, prev))
          setStreaming(true)
        }
      } catch { /* ignore malformed frame */ }
    })
    es.onerror = () => setStreaming(false)
    return () => es.close()
  }, [])

  const list = tab === 'live' ? live : tab === 'recent' ? recent : upcoming
  const label = tab === 'live' ? 'live' : tab === 'recent' ? 'recent' : 'upcoming'
  const liveCount = live.filter((m) => m.matchStarted && !m.matchEnded).length
  const totalMatches = live.length + recent.length + upcoming.length
  const feedEmpty = totalMatches === 0

  return (
    <div className="live-panel" id="fixtures">
      {liveCount > 0 && tab === 'live' && (
        <div className="live-bar">
          <span className="live-dot" />
          <span>{liveCount} match{liveCount === 1 ? '' : 'es'} live now</span>
          {streaming && <span className="live-stream">● Streaming</span>}
        </div>
      )}

      {stale && list.length > 0 && cachedLabel && (
        <div className="alert-banner alert-stale">{cachedLabel}</div>
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
          {feedEmpty ? (
            <>
              <p className="empty-title">Syncing live scores</p>
              <p className="empty-sub">
                First load pulls from our score cache. If nothing appears in a few minutes, the data provider is in a short cooldown — scores fill in automatically once synced.
              </p>
            </>
          ) : (
            <>
              <p className="empty-title">No {label} matches right now</p>
              <p className="empty-sub">Check other tabs — other sections may have matches.</p>
            </>
          )}
        </div>
      ) : (
        <div className="match-list">
          {list.map((m) => <WebMatchCard key={m.id} match={m} />)}
        </div>
      )}
    </div>
  )
}
