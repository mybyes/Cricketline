'use client'

import { useEffect, useState } from 'react'
import type { MatchOddsBoard, OddsDirection, TeamOdds } from '@/lib/odds'
import { activeSession, matchRatePair, sessionPair } from '@/lib/matchRates'
import { getPublicApiUrl } from '@/lib/apiUrl'

const DIR_UP = '\u25B2'
const DIR_DOWN = '\u25BC'

function dirMark(dir?: OddsDirection) {
  if (dir === 'up') return DIR_UP
  if (dir === 'down') return DIR_DOWN
  return null
}

/** Lower quote => more favoured. Returns lean % for team A. */
function leanPct(a?: TeamOdds, b?: TeamOdds): number {
  const ra = a?.back && a.back > 0 ? a.back : 0
  const rb = b?.back && b.back > 0 ? b.back : 0
  if (!ra || !rb) return 50
  const invA = 1 / ra
  const invB = 1 / rb
  return Math.round((invA / (invA + invB)) * 100)
}

/** Chalkboard rate pulse - duel lean + session tape. */
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
      <div className="rp-card rp-empty">
        <span className="rp-kicker">Match rate</span>
        <p className="rp-empty-title">Rates not available yet</p>
        <p className="rp-empty-sub">Appear when the line is live.</p>
      </div>
    )
  }

  const [t0, t1] = board.matchOdds
  const session = activeSession(board)
  const sessPair = session ? sessionPair(session) : null
  const lean = leanPct(t0, t1)

  return (
    <div className={`rp-card${compact ? ' rp-compact' : ''}${board.suspended ? ' rp-suspended' : ''}`}>
      <div className="rp-head">
        <span className="rp-kicker">Match rate</span>
        {board.suspended ? (
          <span className="rp-tag rp-tag-off">Suspended</span>
        ) : (
          <span className="rp-tag"><span className="rp-dot" /> Live</span>
        )}
      </div>

      {t0 && t1 ? (
        <div className="rp-arena" aria-label="Team match rates">
          <RateSide team={t0} align="left" />
          <div className="rp-mid">
            <div className="rp-lean" aria-hidden>
              <div className="rp-lean-a" style={{ width: `${lean}%` }} />
              <div className="rp-lean-b" style={{ width: `${100 - lean}%` }} />
            </div>
            <span className="rp-mid-label">lean</span>
          </div>
          <RateSide team={t1} align="right" />
        </div>
      ) : (
        <div className="rp-arena rp-arena-solo">
          {board.matchOdds.slice(0, 2).map((t) => (
            <RateSide key={t.team} team={t} align="left" />
          ))}
        </div>
      )}

      {session && sessPair ? (
        <div className={`rp-sess${session.status === 'settled' ? ' rp-settled' : ''}`}>
          <div className="rp-sess-meta">
            <span className="rp-kicker">Session</span>
            <span className="rp-sess-name">{session.name}</span>
          </div>
          <div className="rp-tape">
            <div className="rp-wing">
              <span className="rp-wing-label">Yes</span>
              <span className="rp-wing-val">{sessPair[0] || '—'}</span>
            </div>
            <div className="rp-pin">
              <span className="rp-pin-val">{session.line ?? '—'}</span>
              <span className="rp-pin-label">line</span>
            </div>
            <div className="rp-wing rp-wing-b">
              <span className="rp-wing-label">No</span>
              <span className="rp-wing-val">{sessPair[1] || '—'}</span>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  )
}

function RateSide({ team, align }: { team: TeamOdds; align: 'left' | 'right' }) {
  const [a, b] = matchRatePair(team.back, team.lay)
  const mark = dirMark(team.dir)
  return (
    <div className={`rp-side rp-side-${align} ${team.dir === 'up' ? 'rp-up' : team.dir === 'down' ? 'rp-down' : ''}`}>
      <div className="rp-side-top">
        <span className="rp-team">{team.shortname || team.team}</span>
        {mark ? <span className={`rp-dir rp-dir-${team.dir}`}>{mark}</span> : null}
      </div>
      <div className="rp-nums">
        <span className="rp-num">{a}</span>
        <span className="rp-num-sub">{b}</span>
      </div>
    </div>
  )
}
