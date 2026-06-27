import type { InningScorecard } from '@/lib/api'

/** Worm chart — cumulative runs per over for each innings, overlaid for comparison (SVG, no deps). */
export function WormChart({ innings }: { innings: InningScorecard[] }) {
  const series = innings
    .filter((i) => (i.overRuns?.length ?? 0) > 0)
    .map((i) => {
      let sum = 0
      const pts = i.overRuns!.map((r) => (sum += r))
      return { name: i.inning.replace(/ inning.*$/i, ''), pts }
    })
  if (!series.length) return null

  const maxOv = Math.max(...series.map((s) => s.pts.length))
  const maxRuns = Math.max(...series.flatMap((s) => s.pts), 1)
  const W = 620, H = 220, pad = 34
  const x = (ov: number) => pad + (ov / maxOv) * (W - 2 * pad)
  const y = (r: number) => H - pad - (r / maxRuns) * (H - 2 * pad)
  const colors = ['#0f6b40', '#1565c0']

  const yTicks = 4
  const gridY = Array.from({ length: yTicks + 1 }, (_, i) => Math.round((maxRuns / yTicks) * i))
  const xStep = maxOv <= 20 ? 5 : 10
  const gridX = Array.from({ length: Math.floor(maxOv / xStep) + 1 }, (_, i) => i * xStep)

  return (
    <div className="worm">
      <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label="Cumulative runs per over" className="worm-svg">
        {gridY.map((r) => (
          <g key={r}>
            <line x1={pad} x2={W - pad} y1={y(r)} y2={y(r)} className="worm-grid" />
            <text x={pad - 6} y={y(r) + 3} className="worm-axis" textAnchor="end">{r}</text>
          </g>
        ))}
        {gridX.map((ov) => (
          <text key={ov} x={x(ov)} y={H - pad + 14} className="worm-axis" textAnchor="middle">{ov}</text>
        ))}
        {series.map((s, si) => {
          const points = [`${x(0)},${y(0)}`, ...s.pts.map((r, i) => `${x(i + 1)},${y(r)}`)].join(' ')
          return <polyline key={si} points={points} fill="none" stroke={colors[si % colors.length]} strokeWidth={2.5} strokeLinejoin="round" />
        })}
      </svg>
      <div className="worm-legend">
        {series.map((s, si) => (
          <span key={si} className="worm-key"><span className="worm-dot" style={{ background: colors[si % colors.length] }} />{s.name} <strong>{s.pts[s.pts.length - 1]}</strong></span>
        ))}
        <span className="worm-cap">Cumulative runs · overs →</span>
      </div>
    </div>
  )
}
