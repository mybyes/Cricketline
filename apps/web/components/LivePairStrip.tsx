import type { BbbBall, ScorecardData } from '@/lib/api'
import { liveBatters, liveBowler, shortPlayer } from '@/lib/liveContext'

/** Current batters + bowler in one split card — sits below rates. */
export function LivePairStrip({
  data,
  bbb = [],
}: {
  data: ScorecardData
  bbb?: BbbBall[]
}) {
  if (!data.matchStarted || data.matchEnded) return null
  const batters = liveBatters(data)
  const bowler = liveBowler(data, bbb)
  if (!batters.length && !bowler) return null

  return (
    <div className="lp-card" aria-label="Current batters and bowler">
      <div className="lp-side">
        <span className="lp-label">Bat</span>
        {batters.length ? batters.map((b, i) => (
          <div key={b.batsman.id || i} className="lp-line">
            <span className="lp-name">
              {shortPlayer(b.batsman.name)}{i === 0 ? ' *' : ''}
            </span>
            <span className="lp-stat">{b.r}{i === 0 ? '*' : ''} ({b.b})</span>
            <span className="lp-meta">SR {Math.round(b.sr)}</span>
          </div>
        )) : (
          <span className="lp-empty">Batters updating…</span>
        )}
      </div>
      <div className="lp-divider" aria-hidden />
      <div className="lp-side lp-bowl">
        <span className="lp-label">Bowl</span>
        {bowler ? (
          <div className="lp-line">
            <span className="lp-name">{shortPlayer(bowler.bowler.name)}</span>
            <span className="lp-stat">{bowler.w}/{bowler.r} ({bowler.o})</span>
            <span className="lp-meta">Econ {bowler.eco.toFixed(1)}</span>
          </div>
        ) : (
          <span className="lp-empty">—</span>
        )}
      </div>
    </div>
  )
}
