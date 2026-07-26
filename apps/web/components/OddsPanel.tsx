'use client'

import { useEffect, useState } from 'react'
import type { MatchOddsBoard } from '@/lib/odds'
import { activeSession, matchRatePair, sessionPair } from '@/lib/matchRates'
import { getPublicApiUrl } from '@/lib/apiUrl'

/**
 * Both teams' match rates + one live session (next checkpoint only).
 */
export function OddsPanel({
  matchId,
  initial,
  compact = false,
}: {
  matchId: string
  initial?: MatchOddsBoard | null
  compact?: boolean
}) {
  const [board, setBoard] = useState<MatchOddsBoard | null>(initial ?? null)

  useEffect(() => {
    if (initial) setBoard(initial)
  }, [initial])

  useEffect(() => {
    const api = getPublicApiUrl()
    let es: EventSource | null = null
    let poll: ReturnType<typeof setInterval> | null = null
    let alive = true

    const apply = (next: MatchOddsBoard | null) => {
      if (!alive || !next || next.matchId !== matchId) return
      setBoard(next)
    }

    const fetchOnce = async () => {
      try {
        const res = await fetch(`${api}/match/${matchId}/odds`, { cache: 'no-store' })
        const body = await res.json() as { success?: boolean; data?: MatchOddsBoard }
        if (body.success && body.data) apply(body.data)
      } catch { /* keep last */ }
    }

    const onOdds = (ev: MessageEvent) => {
      try {
        const body = JSON.parse(ev.data) as { data?: MatchOddsBoard[] }
        const hit = Array.isArray(body.data) ? body.data.find((b) => b.matchId === matchId) : undefined
        if (hit) apply(hit)
      } catch { /* ignore */ }
    }

    const start = () => {
      es = new EventSource(`${api}/stream`)
      es.addEventListener('odds', onOdds as EventListener)
      es.onerror = () => {
        if (!poll) poll = setInterval(fetchOnce, 5_000)
      }
      es.onopen = () => {
        if (poll) { clearInterval(poll); poll = null }
      }
    }

    if (typeof document !== 'undefined' && document.hidden) {
      poll = setInterval(fetchOnce, 8_000)
    } else {
      start()
    }

    const onVis = () => {
      if (document.hidden) {
        es?.close()
        es = null
        if (!poll) poll = setInterval(fetchOnce, 8_000)
      } else {
        if (poll) { clearInterval(poll); poll = null }
        if (!es) start()
        void fetchOnce()
      }
    }
    document.addEventListener('visibilitychange', onVis)
    void fetchOnce()

    return () => {
      alive = false
      document.removeEventListener('visibilitychange', onVis)
      es?.close()
      if (poll) clearInterval(poll)
    }
  }, [matchId])

  if (!board) {
    return (
      <div className="odds-panel empty-state">
        <p className="empty-title">Rates not available yet</p>
        <p className="empty-sub">Match rate & session appear when the line is live.</p>
      </div>
    )
  }

  const session = activeSession(board)

  return (
    <div className={`odds-panel odds-simple${compact ? ' odds-compact' : ''}`}>
      <div className="odds-head">
        <span className="odds-title">Match rate</span>
        <span className="odds-badge">display only</span>
      </div>

      {board.suspended ? <p className="odds-suspended">Line suspended</p> : null}

      {board.matchOdds.slice(0, 2).map((o) => {
        const [a, b] = matchRatePair(o.back, o.lay)
        return (
          <div
            key={o.team}
            className={`odds-rate-row ${o.dir === 'up' ? 'odds-up' : o.dir === 'down' ? 'odds-down' : ''}`}
          >
            <span className="odds-rate-label">{o.shortname || o.team}</span>
            <span className="odds-dual">
              <span className="odds-rate-box odds-box-pink">{a}</span>
              <span className="odds-rate-box odds-box-green">{b}</span>
            </span>
          </div>
        )
      })}

      {session ? (() => {
        const [a, b] = sessionPair(session)
        return (
          <>
            <div className="odds-section-label" style={{ marginTop: 12 }}>Session</div>
            <div
              className={`odds-rate-row odds-sess-row ${session.status === 'settled' ? 'odds-settled' : ''}`}
            >
              <span className="odds-rate-label">{session.name}</span>
              <span className="odds-dual">
                <span className="odds-rate-box odds-box-pink">{a || '—'}</span>
                <span className="odds-rate-box odds-box-green">{b || '—'}</span>
              </span>
            </div>
          </>
        )
      })() : null}

      <p className="odds-disclaimer">{board.disclaimer}</p>
    </div>
  )
}
