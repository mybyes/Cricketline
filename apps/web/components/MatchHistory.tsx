'use client'

import { useEffect, useMemo, useState } from 'react'
import type { BbbBall, MatchOddsBoard } from '@/lib/api'
import { cgMatchPair, primaryTeam, rateAtBall, shortSessionLabel } from '@/lib/matchRates'
import { ballLinesForOver, buildOverHistory, overOrdinal } from '@/lib/overHistory'
import { buildSessionLadder } from '@/lib/sessionLadder'

function ballChip(b: BbbBall): { bg: string; text: string; label: string } {
  const e = b.event?.toLowerCase() ?? ''
  const r = typeof b.runs === 'number' ? b.runs : parseInt(String(b.runs ?? ''), 10)
  if (e === 'w' || e.includes('wicket')) return { bg: '#e53935', text: '#fff', label: 'W' }
  if (r === 6) return { bg: '#7b1fa2', text: '#fff', label: '6' }
  if (r === 4) return { bg: '#1E88E5', text: '#fff', label: '4' }
  if (r === 0) return { bg: '#ECEFF1', text: '#37474F', label: '0' }
  if (r >= 1 && r <= 3) return { bg: '#43A047', text: '#fff', label: String(r) }
  return { bg: '#43A047', text: '#fff', label: Number.isFinite(r) ? String(r) : '0' }
}

/**
 * CG-style History: over accordion → per-ball rows with match + session dual rates.
 */
export function MatchHistory({
  bbb,
  odds = null,
  battingLabel = 'Score',
  matchType,
}: {
  bbb: BbbBall[]
  odds?: MatchOddsBoard | null
  battingLabel?: string
  scoreLine?: string
  matchType?: string
}) {
  const fmt = (matchType ?? '').toLowerCase()
  const ballsPerOver = fmt.includes('hundred') || fmt.includes('100') ? 5 : 6
  const overs = useMemo(() => buildOverHistory(bbb ?? [], ballsPerOver), [bbb, ballsPerOver])
  const [open, setOpen] = useState<number | null>(null)
  useEffect(() => {
    if (open == null && overs[0]) setOpen(overs[0].overNum)
  }, [overs, open])

  if (!bbb?.length) {
    return (
      <div className="empty-state">
        <p className="empty-title">No ball history yet</p>
        <p className="empty-sub">Over-by-over history appears as balls are bowled.</p>
      </div>
    )
  }

  const team = primaryTeam(odds)
  const baseBack = team?.back ?? 0
  const baseLay = team?.lay
  const teamLabel = team?.shortname || team?.team?.split(' ')[0] || battingLabel

  return (
    <div className="match-history mh-cg">
      <div className="mh-list">
        {overs.map((ov) => {
          const expanded = open === ov.overNum
          const chunk = `${ov.overRuns} Run${ov.overRuns === 1 ? '' : 's'}${ov.overWkts ? `, ${ov.overWkts} w` : ''}`
          const lines = expanded ? ballLinesForOver(ov, ballsPerOver) : []
          return (
            <div key={ov.overNum} className={`mh-over${expanded ? ' mh-over-open' : ''}`}>
              <button
                type="button"
                className="mh-row mh-over-btn"
                aria-expanded={expanded}
                onClick={() => setOpen(expanded ? null : ov.overNum)}
              >
                <div>
                  <strong>{overOrdinal(ov.overNum)} Over:</strong>
                  <span className="mh-chunk"> {chunk}</span>
                </div>
                <div className="mh-row-right">
                  <span className="mh-total">{battingLabel}: {ov.totalRuns}-{ov.totalWkts}</span>
                  <span className="mh-chev" aria-hidden>{expanded ? '▴' : '▾'}</span>
                </div>
              </button>
              {expanded ? (
                <div className="mh-detail mh-balls">
                  {lines.map((line) => {
                    const c = ballChip(line.ball)
                    const back = rateAtBall(baseBack, line.afterBalls)
                    const [ma, mb] = cgMatchPair(
                      back,
                      baseLay != null ? rateAtBall(baseLay, line.afterBalls) : undefined,
                    )
                    const sess = buildSessionLadder({
                      matchType,
                      currentOvers: line.oversAtBall,
                      currentRuns: line.totalRuns,
                      ballsFaced: line.afterBalls,
                    })[0]
                    const sessLine = sess ? rateAtBall(sess.line || sess.yes || 0, line.afterBalls) : 0
                    const sa = sessLine > 0 ? Math.round(sessLine) : 0
                    const sb = sa > 0 ? sa + 1 : 0
                    const sessName = sess ? shortSessionLabel(sess.name) : ''
                    return (
                      <div key={`${line.notation}-${line.afterBalls}`} className="mh-ball-row">
                        <span className="mh-ball" style={{ background: c.bg, color: c.text }}>{c.label}</span>
                        <div className="mh-ball-mid">
                          <div className="mh-ball-score">
                            {line.totalRuns}-{line.totalWkts}
                            <span className="mh-ball-not"> {line.notation}</span>
                          </div>
                          <div className="mh-ball-time">{line.timeLabel}</div>
                        </div>
                        <div className="mh-rate-box">
                          {baseBack > 0 ? (
                            <div className="mh-rate-line">
                              <span>{teamLabel}</span>
                              <span className="odds-dual">
                                <em className="odds-box-pink mh-em">{ma}</em>
                                <em className="odds-box-green mh-em">{mb}</em>
                              </span>
                            </div>
                          ) : null}
                          {sa > 0 ? (
                            <div className="mh-rate-line">
                              <span>{sessName}</span>
                              <span className="odds-dual">
                                <em className="odds-box-pink mh-em">{sa}</em>
                                <em className="odds-box-green mh-em">{sb}</em>
                              </span>
                            </div>
                          ) : null}
                        </div>
                      </div>
                    )
                  })}
                </div>
              ) : null}
            </div>
          )
        })}
      </div>
    </div>
  )
}
