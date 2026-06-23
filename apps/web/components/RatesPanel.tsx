import type { ScorecardData } from '@/lib/api'

/** Run-rate analytics (CRR / RRR / target / projected) — match data, not betting odds. */
function oversToBalls(o: number): number {
  const whole = Math.floor(o)
  return whole * 6 + Math.round((o - whole) * 10)
}

export function RatesPanel({ data }: { data: ScorecardData }) {
  const innings = data.scorecard ?? []
  const cur = innings[innings.length - 1]
  if (!cur?.totals) {
    return <div className="empty-state"><p className="empty-title">Rates not available yet</p><p className="empty-sub">Run-rate analytics appear once the innings is underway.</p></div>
  }

  const fmt = data.matchType?.toLowerCase()
  const oversTotal = fmt === 'odi' ? 50 : fmt === 'test' ? null : 20
  const balls = oversToBalls(cur.totals.o)
  const crr = balls > 0 ? cur.totals.r / (balls / 6) : 0

  const isChase = innings.length >= 2 && oversTotal != null
  const target = isChase ? (innings[0].totals?.r ?? 0) + 1 : null
  const ballsLeft = oversTotal != null ? oversTotal * 6 - balls : null
  const need = target != null ? Math.max(0, target - cur.totals.r) : null
  const rrr = need != null && ballsLeft != null && ballsLeft > 0 ? need / (ballsLeft / 6) : null
  const projected = !isChase && oversTotal != null ? Math.round(crr * oversTotal) : null

  const metrics = [
    { label: 'Current RR', value: crr.toFixed(2) },
    ...(rrr != null ? [{ label: 'Required RR', value: rrr.toFixed(2) }] : []),
    ...(target != null ? [{ label: 'Target', value: String(target) }] : []),
    ...(projected != null ? [{ label: 'Projected', value: String(projected) }] : []),
  ]

  // CRR vs RRR comparison bar
  const total = (crr || 0) + (rrr || 0)
  const crrPct = total > 0 ? Math.round((crr / total) * 100) : 50

  return (
    <div className="rates">
      <div className="rates-grid">
        {metrics.map((m) => (
          <div key={m.label} className="rate-card">
            <span className="rate-label">{m.label}</span>
            <span className="rate-value">{m.value}</span>
          </div>
        ))}
      </div>

      {need != null && ballsLeft != null && (
        <p className="rates-need">{data.teams[1]} need <strong>{need}</strong> off <strong>{ballsLeft}</strong> balls</p>
      )}

      {rrr != null && (
        <div className="rates-compare">
          <div className="rc-row"><span>Current {crr.toFixed(2)}</span><span>Required {rrr.toFixed(2)}</span></div>
          <div className="rc-bar"><div className="rc-fill" style={{ width: `${crrPct}%`, background: crr >= rrr ? 'var(--green)' : 'var(--live)' }} /></div>
          <p className="rc-note">{crr >= rrr ? 'Chasing side is ahead of the rate.' : 'Required rate is climbing above current.'}</p>
        </div>
      )}
    </div>
  )
}
