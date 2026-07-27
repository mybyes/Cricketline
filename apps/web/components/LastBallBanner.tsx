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
  if (e === 'w' || e.includes('wicket')) return { bg: '#FF1744', label: 'W' }
  if (r === 6) return { bg: '#00B8D4', label: '6' }
  if (r === 4) return { bg: '#00C853', label: '4' }
  if (r === 0) return { bg: '#424242', label: '·' }
  return { bg: '#1565c0', label: Number.isFinite(r) ? String(r) : '·' }
}

function overRuns(balls: BbbBall[]) {
  return balls.reduce((s, b) => s + (typeof b.runs === 'number' ? b.runs : 0), 0)
}

function OverRail({
  label,
  balls,
  runs,
  latestIdx,
  dim,
  padTo,
}: {
  label: string
  balls: BbbBall[]
  runs: number
  latestIdx?: number
  dim?: boolean
  /** Show empty slots ahead (current over progress). */
  padTo?: number
}) {
  const slots = padTo != null ? Math.max(padTo, balls.length) : balls.length
  return (
    <div className={`lb-rail-block${dim ? ' lb-rail-dim' : ''}`}>
      <span className="lb-rail-tag">{label}</span>
      <div className="lb-seg">
        {Array.from({ length: slots }, (_, i) => {
          const b = balls[i]
          if (!b) {
            return <span key={`e-${i}`} className="lb-chip lb-chip-empty" aria-hidden />
          }
          const c = chip(b)
          return (
            <span
              key={i}
              className={`lb-chip${!dim && i === latestIdx ? ' lb-chip-latest' : ''}${dim ? ' lb-chip-dim' : ''}`}
              style={{ background: c.bg }}
            >
              {c.label}
            </span>
          )
        })}
      </div>
      <span className="lb-rail-sum">{runs}</span>
    </div>
  )
}

/** Compact last-ball + left→right over progress (prev → current). */
export function LastBallBanner({ bbb }: { bbb: BbbBall[] }) {
  if (!bbb.length) return null
  const last = bbb[bbb.length - 1]
  const curOver = last.overNum ?? Math.ceil((last.ballNbr ?? bbb.length) / 6)
  const thisOver = bbb.filter((b) => (b.overNum ?? 0) === curOver)
  const prevOverNum = curOver > 1 ? curOver - 1 : null
  const prevOver = prevOverNum != null
    ? bbb.filter((b) => (b.overNum ?? 0) === prevOverNum)
    : []
  const thisRuns = overRuns(thisOver)
  const latestIdx = thisOver.length - 1
  const progress = Math.min(1, thisOver.length / 6)

  return (
    <div className="lb-wrap">
      <div className="lb-banner">
        <div className="lb-banner-row">
          <div className="lb-live"><span className="lb-dot" /> LIVE</div>
          <div className="lb-headline">{narrate(last)}</div>
        </div>
      </div>
      <div className="lb-rail" aria-label="Over progress">
        {prevOver.length > 0 && prevOverNum != null ? (
          <OverRail
            label={`Ov ${prevOverNum}`}
            balls={prevOver}
            runs={overRuns(prevOver)}
            dim
          />
        ) : null}
        {prevOver.length > 0 ? (
          <div className="lb-progress" aria-hidden>
            <div className="lb-progress-track">
              <div className="lb-progress-fill" style={{ width: `${progress * 100}%` }} />
            </div>
          </div>
        ) : null}
        <OverRail
          label={`Ov ${curOver}`}
          balls={thisOver}
          runs={thisRuns}
          latestIdx={latestIdx}
          padTo={6}
        />
      </div>
    </div>
  )
}
