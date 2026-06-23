import type { BbbBall } from '@/lib/api'

/** Cricline-style ball colours: W=red, 6=purple, 4=orange, dot=grey, else blue. */
function ballStyle(b: BbbBall): { bg: string; label: string } {
  const e = b.event?.toLowerCase() ?? ''
  const runs = typeof b.runs === 'number' ? b.runs : parseInt(String(b.runs ?? ''), 10)
  if (e === 'w' || e.includes('wicket') || e.includes('out')) return { bg: '#e53935', label: 'W' }
  if (runs === 6) return { bg: '#7b1fa2', label: '6' }
  if (runs === 4) return { bg: '#f57f17', label: '4' }
  if (runs === 0) return { bg: '#424242', label: '·' }
  return { bg: '#1565c0', label: Number.isFinite(runs) ? String(runs) : (b.event ?? '·') }
}

interface OverGroup { overNum: number; balls: BbbBall[] }

function groupByOver(bbb: BbbBall[], maxBalls = 60): OverGroup[] {
  const recent = bbb.slice(-maxBalls)
  const map = new Map<number, BbbBall[]>()
  for (const b of recent) {
    const over = b.overNum ?? 0
    if (!map.has(over)) map.set(over, [])
    map.get(over)!.push(b)
  }
  return [...map.entries()].sort((a, b) => b[0] - a[0]).map(([overNum, balls]) => ({ overNum, balls }))
}

function overRuns(balls: BbbBall[]) {
  return balls.reduce((sum, b) => sum + (typeof b.runs === 'number' ? b.runs : 0), 0)
}

export function Commentary({ bbb }: { bbb: BbbBall[] }) {
  if (!bbb?.length) {
    return (
      <div className="empty-state">
        <p className="empty-title">No ball-by-ball yet</p>
        <p className="empty-sub">Live commentary appears here once play begins (when the feed provides it).</p>
      </div>
    )
  }

  const overs = groupByOver(bbb)

  return (
    <div className="commentary">
      {overs.map((grp) => (
        <div key={grp.overNum} className="over-row">
          <div className="over-label">
            <span className="over-num">Ov {grp.overNum}</span>
            <span className="over-runs">{overRuns(grp.balls)} runs</span>
          </div>
          <div className="ball-strip">
            {grp.balls.map((b, i) => {
              const s = ballStyle(b)
              return (
                <span key={i} className="ball-chip" style={{ background: s.bg }} title={`${b.batsman ?? ''} · ${b.bowler ?? ''}`}>
                  {s.label}
                </span>
              )
            })}
          </div>
        </div>
      ))}
    </div>
  )
}
