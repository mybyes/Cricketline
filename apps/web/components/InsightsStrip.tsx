import type { MatchIntelligence } from '@/lib/intelligence'

function shortTeam(name: string) {
  const parts = name.trim().split(/\s+/)
  if (parts.length === 1) return parts[0].slice(0, 4).toUpperCase()
  return parts.map((p) => p[0]).join('').slice(0, 4).toUpperCase()
}

/** Compact CIE insights under Live — chalkboard accent, no AI jargon. */
export function InsightsStrip({ intel }: { intel: MatchIntelligence | null }) {
  if (!intel?.narrative?.headline) return null

  const win = intel.winProbability
  const mom = intel.momentum
  const arrow = mom.direction === 'UP' ? '↑' : mom.direction === 'DOWN' ? '↓' : '→'
  const tp = intel.turningPoints?.[0]
  const batPct = win?.battingPct ?? null
  const bowlPct = win?.bowlingPct ?? null

  return (
    <section className="ins-strip" aria-label="Match insights">
      <div className="ins-kicker">Insights</div>
      <h3 className="ins-headline">{intel.narrative.headline}</h3>
      <p className="ins-summary">{intel.narrative.summary}</p>

      {win && batPct != null && bowlPct != null ? (
        <div className="ins-win" aria-label={`${shortTeam(win.leader)} ${Math.max(batPct, bowlPct)} percent winning lean`}>
          <div className="ins-win-labels">
            <span className="ins-win-leader">{shortTeam(win.leader)} {Math.max(batPct, bowlPct)}%</span>
            <span className="ins-win-sub">winning lean</span>
          </div>
          <div className="ins-win-track" role="img" aria-hidden>
            <div className="ins-win-fill" style={{ width: `${batPct}%` }} />
          </div>
          <div className="ins-win-ends">
            <span>Bat {batPct}%</span>
            <span>Bowl {bowlPct}%</span>
          </div>
        </div>
      ) : null}

      <div className="ins-metrics">
        <div className="ins-metric">
          <span className="ins-metric-label">Pressure</span>
          <span className={`ins-metric-value ins-p-${intel.pressure.level.toLowerCase()}`}>
            {intel.pressure.level}
          </span>
        </div>
        <div className="ins-metric">
          <span className="ins-metric-label">Momentum</span>
          <span className="ins-metric-value">
            {arrow} {shortTeam(mom.team)}{mom.value !== 0 ? ` ${mom.value > 0 ? '+' : ''}${Math.round(mom.value)}` : ''}
          </span>
        </div>
        {intel.projection ? (
          <div className="ins-metric">
            <span className="ins-metric-label">Project</span>
            <span className="ins-metric-value">
              {intel.projection.low}–{intel.projection.high}
            </span>
          </div>
        ) : null}
        {intel.partnership.runs > 0 ? (
          <div className="ins-metric">
            <span className="ins-metric-label">Stand</span>
            <span className="ins-metric-value">
              {intel.partnership.runs} ({intel.partnership.balls})
            </span>
          </div>
        ) : null}
      </div>

      {tp ? (
        <div className="ins-tp">
          <span className="ins-tp-kicker">Turning point · {tp.overLabel}</span>
          <span className="ins-tp-title">{tp.title}</span>
          <span className="ins-tp-reason">{tp.reason}</span>
        </div>
      ) : null}
    </section>
  )
}
