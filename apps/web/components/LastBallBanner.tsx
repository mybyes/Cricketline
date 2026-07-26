import type { BbbBall } from '@/lib/api'

function narrate(b: BbbBall): string {
  const e = b.event?.toLowerCase() ?? ''
  const r = typeof b.runs === 'number' ? b.runs : -1
  if (e === 'w' || e.includes('wicket') || e.includes('out')) return 'Wicket'
  if (r === 6) return '6 Runs'
  if (r === 4) return '4 Runs'
  if (r === 0) return '0 Run'
  if (r === 1) return '1 Run'
  if (r > 1) return `${r} Runs`
  return b.event ?? 'Ball'
}

function chip(b: BbbBall): { bg: string; label: string } {
  const e = b.event?.toLowerCase() ?? ''
  const r = typeof b.runs === 'number' ? b.runs : parseInt(String(b.runs ?? ''), 10)
  if (e === 'w' || e.includes('wicket')) return { bg: '#e53935', label: 'W' }
  if (r === 6) return { bg: '#7b1fa2', label: '6' }
  if (r === 4) return { bg: '#f57f17', label: '4' }
  if (r === 0) return { bg: '#424242', label: '·' }
  return { bg: '#1565c0', label: Number.isFinite(r) ? String(r) : '·' }
}

function overRuns(balls: BbbBall[]) {
  return balls.reduce((s, b) => s + (typeof b.runs === 'number' ? b.runs : 0), 0)
}

/** Chalkboard last-ball panel + recent over chips. */
export function LastBallBanner({
  bbb,
  scoreLine,
}: {
  bbb: BbbBall[]
  scoreLine?: string
}) {
  if (!bbb.length) return null
  const last = bbb[bbb.length - 1]
  const curOver = last.overNum
  const byOver = new Map<number, BbbBall[]>()
  for (const b of bbb.slice(-18)) {
    const o = b.overNum ?? 0
    if (!byOver.has(o)) byOver.set(o, [])
    byOver.get(o)!.push(b)
  }
  const overs = [...byOver.entries()].sort((a, b) => a[0] - b[0]).slice(-2)

  return (
    <div className="lb-wrap">
      <div className="lb-banner">
        <div className="lb-live"><span className="lb-dot" /> LIVE</div>
        <div className="lb-headline">{narrate(last)}</div>
        {scoreLine ? <div className="lb-score">{scoreLine}</div> : null}
      </div>
      {overs.length > 0 && (
        <div className="lb-overs">
          {overs.map(([num, balls]) => (
            <div key={num} className="lb-seg">
              {balls.map((b, i) => {
                const c = chip(b)
                return <span key={i} className="lb-chip" style={{ background: c.bg }}>{c.label}</span>
              })}
              {(num !== curOver || balls.length >= 6) && (
                <span className="lb-total">= {overRuns(balls)}</span>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
