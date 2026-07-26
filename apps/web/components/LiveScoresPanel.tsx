'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import type { Match } from '@/lib/api'
import type { MatchOddsBoard } from '@/lib/odds'
import { getPublicApiUrl } from '@/lib/apiUrl'
import { staleNotice } from '@/lib/cacheTime'
import { loadHomeCache, mergeMatchList, saveHomeCache } from '@/lib/matchCache'
import { isLiveMatch } from '@/lib/matchState'
import { usePolling } from '@/lib/usePolling'
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


function shortOf(match: Match, i: number) {
  return match.teamInfo?.[i]?.shortname
    ?? match.teams[i]?.split(' ').map((w) => w[0]).join('').slice(0, 3).toUpperCase()
    ?? '?'
}

/** Slim chalk card — shortnames + score + one status line. */
function WebMatchCard({ match, odds }: { match: Match; odds?: MatchOddsBoard | null }) {
  const live = match.matchStarted && !match.matchEnded
  const fmt = (match.matchType ?? 'match').toUpperCase()
  const scores = match.score ?? []
  const t0 = match.teams[0]?.toLowerCase().split(' ')[0] ?? ''
  const t1 = match.teams[1]?.toLowerCase().split(' ')[0] ?? ''
  const s0 = scores.find((s) => s.inning.toLowerCase().includes(t0))
  const s1 = scores.find((s) => s.inning.toLowerCase().includes(t1))
  const series = match.name.split(',').pop()?.trim()
  const state = live ? 'LIVE' : match.matchEnded ? 'RESULT' : 'UP'

  return (
    <Link href={`/match/${match.id}`} className={`w-match ${live ? 'w-match-live' : ''}`}>
      <div className="w-match-head">
        <span className="w-match-fmt">
          {live ? <span className="w-live-dot" aria-hidden /> : null}
          {fmt}
          {series ? ` · ${series}` : ''}
        </span>
        <span className={`w-match-badge ${live ? 'w-badge-live' : match.matchEnded ? 'w-badge-result' : 'w-badge-up'}`}>
          {state}
        </span>
      </div>

      <div className="w-match-body">
        <div className="w-side">
          <TeamBadge shortname={shortOf(match, 0)} name={match.teams[0]} img={match.teamInfo?.[0]?.img} size={28} />
          <div className="w-side-text">
            <span className="w-short">{shortOf(match, 0)}</span>
            <span className="w-score">
              {s0 ? <>{s0.r}/{s0.w}<small> ({s0.o})</small></> : '—'}
            </span>
          </div>
        </div>
        <span className="w-vs">v</span>
        <div className="w-side w-side-r">
          <div className="w-side-text w-side-text-r">
            <span className="w-short">{shortOf(match, 1)}</span>
            <span className="w-score">
              {s1 ? <>{s1.r}/{s1.w}<small> ({s1.o})</small></> : '—'}
            </span>
          </div>
          <TeamBadge shortname={shortOf(match, 1)} name={match.teams[1]} img={match.teamInfo?.[1]?.img} size={28} />
        </div>
      </div>

      {live && odds?.matchOdds?.length ? (
        <div className="w-odds">
          {odds.matchOdds.slice(0, 2).map((o) => (
            <span key={o.team} className={`w-odds-chip ${o.dir === 'up' ? 'up' : o.dir === 'down' ? 'down' : ''}`}>
              <em>{o.shortname || o.team.slice(0, 3)}</em>
              <strong>{o.back < 40 ? o.back.toFixed(2) : Math.round(o.back)}</strong>
            </span>
          ))}
        </div>
      ) : null}

      <p className={`w-status ${live ? 'w-status-live' : ''}`} title={match.status}>
        {match.status}
      </p>
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
  const [oddsById, setOddsById] = useState<Record<string, MatchOddsBoard>>({})
  const [cachedLabel, setCachedLabel] = useState<string | null>(
    (initial?.stale || boot.diskAt) && (initial?.cachedAt ?? boot.diskAt)
      ? staleNotice(initial?.cachedAt ?? boot.diskAt)
      : null,
  )

  const load = useCallback(async () => {
    const [l, r, u, oRes] = await Promise.all([
      fetchMatches('/matches/live'),
      fetchMatches('/matches/recent'),
      fetchMatches('/matches/upcoming'),
      fetch(`${API}/odds/live`, { cache: 'no-store' }).then((res) => res.json()).catch(() => null),
    ])
    const disk = loadHomeCache()
    const nextLive = mergeMatchList(l.data, liveRef.current.length ? liveRef.current : (disk?.live ?? []))
    const nextRecent = mergeMatchList(r.data, recentRef.current.length ? recentRef.current : (disk?.recent ?? []))
    const nextUpcoming = mergeMatchList(u.data, upcomingRef.current.length ? upcomingRef.current : (disk?.upcoming ?? []))
    setLive(nextLive)
    setRecent(nextRecent)
    setUpcoming(nextUpcoming)
    if (oRes?.success && Array.isArray(oRes.data)) {
      const map: Record<string, MatchOddsBoard> = {}
      for (const board of oRes.data as MatchOddsBoard[]) map[board.matchId] = board
      setOddsById(map)
    }
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

  // Fallback poll (SSE is primary) — paused while the tab is hidden / offline, slowed on Save-Data.
  usePolling(load, 15_000)

  // Real-time push: subscribe to the SSE stream and apply live updates instantly.
  // Connection is held only while the tab is visible — on a hidden tab we close it, which
  // stops the client receiving pushes AND (via the backend's client gating) stops the server
  // publishing for us. Saves bandwidth on low/metered connections; reopens on return.
  useEffect(() => {
    if (typeof window === 'undefined' || !('EventSource' in window)) return
    let es: EventSource | null = null

    const onScores = (e: Event) => {
      try {
        const body = JSON.parse((e as MessageEvent).data) as { data?: Match[] }
        if (Array.isArray(body.data) && body.data.length) {
          setLive((prev) => mergeMatchList(body.data!, prev))
        }
      } catch { /* ignore malformed frame */ }
    }
    const onOdds = (e: Event) => {
      try {
        const body = JSON.parse((e as MessageEvent).data) as { data?: MatchOddsBoard[] }
        if (!Array.isArray(body.data)) return
        setOddsById((prev) => {
          const next = { ...prev }
          for (const board of body.data!) next[board.matchId] = board
          return next
        })
      } catch { /* ignore */ }
    }
    const connect = () => {
      if (es || document.visibilityState !== 'visible') return
      es = new EventSource(`${API}/stream`)
      es.addEventListener('scores', onScores)
      es.addEventListener('odds', onOdds)
    }
    const disconnect = () => { es?.close(); es = null }
    const onVisibility = () => { document.visibilityState === 'visible' ? connect() : disconnect() }

    connect()
    document.addEventListener('visibilitychange', onVisibility)
    return () => {
      document.removeEventListener('visibilitychange', onVisibility)
      disconnect()
    }
  }, [])

  const liveOnly = live.filter(isLiveMatch)
  const list = tab === 'live' ? liveOnly : tab === 'recent' ? recent : upcoming
  const label = tab === 'live' ? 'live' : tab === 'recent' ? 'recent' : 'upcoming'
  const totalMatches = liveOnly.length + recent.length + upcoming.length
  const feedEmpty = totalMatches === 0

  return (
    <div className="live-panel" id="fixtures">
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
            {t === 'live' ? `Live (${liveOnly.length})` : t === 'recent' ? `Results (${recent.length})` : `Fixtures (${upcoming.length})`}
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
        <div className="match-rail" role="list">
          {list.map((m) => (
            <div key={m.id} className="match-rail-item" role="listitem">
              <WebMatchCard match={m} odds={oddsById[m.id]} />
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
