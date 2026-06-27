import type { InningScorecard } from '@/lib/api'

/** Rate history — run rate (CRR) progression per over, with required rate (RRR) for a chase. Analytics, not odds. */
export function RateHistory({ innings, matchType }: { innings: InningScorecard[]; matchType?: string }) {
  const fmt = matchType?.toLowerCase()
  const oversTotal = fmt === 'odi' ? 50 : fmt === 'test' ? null : 20
  const cur = innings.filter((i) => (i.overRuns?.length ?? 0) > 0).slice(-1)[0]
  if (!cur) return null

  const runs = cur.overRuns!
  let cum = 0
  const crr = runs.map((r, i) => { cum += r; return cum / (i + 1) })

  // Required rate per over, only when chasing a limited-overs target.
  let rrr: (number | null)[] | null = null
  const isChase = innings.length >= 2 && oversTotal != null
  if (isChase && oversTotal) {
    const target = (innings[0].totals?.r ?? 0) + 1
    let c = 0
    rrr = runs.map((r, i) => {
      c += r
      const oversLeft = oversTotal - (i + 1)
      const need = target - c
      return oversLeft > 0 && need > 0 ? need / oversLeft : null
    })
  }

  const maxOv = runs.length
  const allRates = [...crr, ...((rrr ?? []).filter((x): x is number => x != null))]
  const maxR = Math.max(...allRates, 6)
  const W = 620, H = 200, pad = 34
  const x = (ov: number) => pad + (ov / maxOv) * (W - 2 * pad)
  const y = (r: number) => H - pad - (r / maxR) * (H - 2 * pad)

  const yTicks = 4
  const gridY = Array.from({ length: yTicks + 1 }, (_, i) => Math.round((maxR / yTicks) * i))
  const xStep = maxOv <= 20 ? 5 : 10
  const gridX = Array.from({ length: Math.floor(maxOv / xStep) + 1 }, (_, i) => i * xStep)

  const crrPts = crr.map((r, i) => `${x(i + 1)},${y(r)}`).join(' ')
  const rrrPts = rrr ? rrr.map((r, i) => (r != null ? `${x(i + 1)},${y(r)}` : null)).filter(Boolean).join(' ') : ''

  return (
    <div className="worm">
      <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label="Run rate per over" className="worm-svg">
        {gridY.map((r) => (
          <g key={r}>
            <line x1={pad} x2={W - pad} y1={y(r)} y2={y(r)} className="worm-grid" />
            <text x={pad - 6} y={y(r) + 3} className="worm-axis" textAnchor="end">{r}</text>
          </g>
        ))}
        {gridX.map((ov) => <text key={ov} x={x(ov)} y={H - pad + 14} className="worm-axis" textAnchor="middle">{ov}</text>)}
        {rrr && <polyline points={rrrPts} fill="none" stroke="#e8a417" strokeWidth={2.5} strokeDasharray="5 4" strokeLinejoin="round" />}
        <polyline points={crrPts} fill="none" stroke="#0f6b40" strokeWidth={2.5} strokeLinejoin="round" />
      </svg>
      <div className="worm-legend">
        <span className="worm-key"><span className="worm-dot" style={{ background: '#0f6b40' }} />Current rate <strong>{crr[crr.length - 1].toFixed(2)}</strong></span>
        {rrr && (() => { const last = rrr.filter((x): x is number => x != null).slice(-1)[0]; return last != null ? <span className="worm-key"><span className="worm-dot" style={{ background: '#e8a417' }} />Required rate <strong>{last.toFixed(2)}</strong></span> : null })()}
        <span className="worm-cap">Run rate · overs →</span>
      </div>
    </div>
  )
}
