import type { InningScorecard } from '@/lib/api'
import { RateHistory } from './RateHistory'
import { WormChart } from './WormChart'

/** Over-phase analytics computed from real per-over runs + fall of wickets. Stats, not betting lines. */
function wktsBy(inn: InningScorecard, over: number): number {
  return (inn.fallOfWickets ?? []).filter((f) => f.over <= over).length
}

function phase(inn: InningScorecard, from: number, to: number) {
  const runs = (inn.overRuns ?? []).slice(from - 1, to).reduce((a, b) => a + b, 0)
  const overs = Math.min(to, inn.overRuns?.length ?? 0) - (from - 1)
  const wkts = wktsBy(inn, to) - wktsBy(inn, from - 1)
  const rr = overs > 0 ? runs / overs : 0
  return { runs, wkts: Math.max(0, wkts), overs: Math.max(0, overs), rr }
}

function cumAt(inn: InningScorecard, over: number) {
  const runs = (inn.overRuns ?? []).slice(0, over).reduce((a, b) => a + b, 0)
  return { runs, wkts: wktsBy(inn, over) }
}

export function SessionAnalytics({ innings, matchType }: { innings: InningScorecard[]; matchType?: string }) {
  const withData = innings.filter((i) => (i.overRuns?.length ?? 0) > 0)
  if (!withData.length) {
    return (
      <div className="empty-state">
        <p className="empty-title">Session analytics not available yet</p>
        <p className="empty-sub">Powerplay, middle and death-overs breakdown appears once the innings is underway.</p>
      </div>
    )
  }

  return (
    <div className="session">
      {withData.length >= 1 && (
        <section className="session-inn">
          <h3 className="m-sub">Run progression (Worm)</h3>
          <WormChart innings={withData} />
        </section>
      )}
      {withData.length >= 1 && (
        <section className="session-inn">
          <h3 className="m-sub">Rate history</h3>
          <RateHistory innings={withData} matchType={matchType} />
        </section>
      )}
      {withData.map((inn, i) => {
        const overs = inn.overRuns ?? []
        const total = overs.length
        const isT20 = total <= 20
        const phases = isT20
          ? [{ k: 'Powerplay', r: '1–6', ...phase(inn, 1, 6) }, { k: 'Middle', r: '7–15', ...phase(inn, 7, 15) }, { k: 'Death', r: '16–20', ...phase(inn, 16, 20) }]
          : [{ k: 'First 10', r: '1–10', ...phase(inn, 1, 10) }, { k: 'Middle', r: '11–40', ...phase(inn, 11, 40) }, { k: 'Final', r: '41–50', ...phase(inn, 41, 50) }]
        const splits = isT20 ? [6, 10, 15] : [10, 25, 40]
        const max = Math.max(...overs, 1)

        return (
          <section key={i} className="session-inn">
            <h3 className="m-sub">{inn.inning.replace(/ inning.*$/i, '')}</h3>

            <div className="phase-grid">
              {phases.filter((p) => p.overs > 0).map((p) => (
                <div key={p.k} className="phase-card">
                  <span className="phase-name">{p.k} <small>({p.r})</small></span>
                  <span className="phase-score">{p.runs}/{p.wkts}</span>
                  <span className="phase-rr">RR {p.rr.toFixed(2)}</span>
                </div>
              ))}
            </div>

            <div className="session-splits">
              {splits.filter((o) => o <= total).map((o) => {
                const c = cumAt(inn, o)
                return <span key={o} className="split-chip">After {o} ov <strong>{c.runs}/{c.wkts}</strong></span>
              })}
            </div>

            <div className="manhattan">
              {overs.map((r, oi) => (
                <div key={oi} className="mh-col" title={`Over ${oi + 1}: ${r}`}>
                  <div className="mh-bar" style={{ height: `${Math.round((r / max) * 100)}%` }} />
                  <span className="mh-ov">{oi + 1}</span>
                </div>
              ))}
            </div>
            <p className="manhattan-cap">Runs per over (Manhattan)</p>
          </section>
        )
      })}
    </div>
  )
}
