import type { BbbBall, ScorecardData } from '@/lib/api'

/** Cricket overs notation (14.3 = 14 overs 3 balls) → total balls. */
function oversToBalls(o: number): number {
  const whole = Math.floor(o)
  const balls = Math.round((o - whole) * 10)
  return whole * 6 + balls
}

function fmtOvers(balls: number): string {
  return `${Math.floor(balls / 6)}.${balls % 6}`
}

export function LiveSummary({ data, bbb }: { data: ScorecardData; bbb: BbbBall[] }) {
  const innings = data.scorecard ?? []
  if (!innings.length) return null
  const cur = innings[innings.length - 1]
  const totals = cur.totals
  if (!totals) return null

  const crease = cur.batting.filter((b) => /batting|not out/i.test(b['dismissal-text']))
  const lastBall = bbb[bbb.length - 1]
  const bowlerName = lastBall?.bowler
  const bowler = bowlerName ? cur.bowling.find((bw) => bw.bowler?.name?.includes(bowlerName) || bowlerName.includes(bw.bowler?.name ?? '')) : undefined
  const thisOverNum = lastBall?.overNum
  const thisOver = thisOverNum != null ? bbb.filter((b) => b.overNum === thisOverNum) : []

  const balls = oversToBalls(totals.o)
  const crr = balls > 0 ? (totals.r / (balls / 6)) : 0
  const oversTotal = data.matchType?.toLowerCase() === 'odi' ? 50 : data.matchType?.toLowerCase() === 'test' ? null : 20

  let target: number | null = null
  let rrr: number | null = null
  let projected: number | null = null
  if (innings.length >= 2 && oversTotal) {
    target = (innings[0].totals?.r ?? 0) + 1
    const ballsLeft = oversTotal * 6 - balls
    const need = target - totals.r
    rrr = ballsLeft > 0 ? need / (ballsLeft / 6) : 0
  } else if (oversTotal) {
    projected = Math.round(crr * oversTotal)
  }

  const lastFow = cur.fallOfWickets?.[cur.fallOfWickets.length - 1]
  const partnershipRuns = lastFow ? totals.r - lastFow.runs : totals.r

  function ballChip(b: BbbBall, i: number) {
    const e = b.event?.toLowerCase() ?? ''
    const r = typeof b.runs === 'number' ? b.runs : -1
    let bg = '#1565c0', label = String(b.runs ?? '·')
    if (e === 'w' || e.includes('wicket') || e.includes('out')) { bg = '#e53935'; label = 'W' }
    else if (r === 6) { bg = '#7b1fa2'; label = '6' }
    else if (r === 4) { bg = '#f57f17'; label = '4' }
    else if (r === 0) { bg = '#424242'; label = '·' }
    return <span key={i} className="ls-ball" style={{ background: bg }}>{label}</span>
  }

  return (
    <div className="ls">
      <div className="ls-score-row">
        <div className="ls-score-main">
          <span className="ls-team">{cur.inning.replace(/ inning.*$/i, '')}</span>
          <span className="ls-score">{totals.r}/{totals.w} <small>({fmtOvers(balls)} ov)</small></span>
        </div>
        <div className="ls-rates">
          <span>CRR <strong>{crr.toFixed(2)}</strong></span>
          {rrr != null && <span>RRR <strong>{rrr.toFixed(2)}</strong></span>}
          {projected != null && <span>Proj <strong>{projected}</strong></span>}
        </div>
      </div>

      {target != null && (
        <p className="ls-target">Target <strong>{target}</strong> · {data.teams[1] === cur.inning.replace(/ inning.*$/i, '') ? data.teams[1] : ''} need <strong>{Math.max(0, target - totals.r)}</strong> {oversTotal ? `from ${oversTotal * 6 - balls} balls` : ''}</p>
      )}

      {crease.length > 0 && (
        <div className="ls-batters">
          <div className="ls-sub">Batting</div>
          {crease.map((b, i) => (
            <div key={i} className="ls-bat-row">
              <span className="ls-name">{b.batsman?.name}{i === 0 ? ' *' : ''}</span>
              <span className="ls-bat-fig">{b.r} <small>({b.b})</small></span>
              <span className="ls-bat-sr">SR {b.sr}</span>
            </div>
          ))}
        </div>
      )}

      {bowler && (
        <div className="ls-bowler">
          <div className="ls-sub">Bowling</div>
          <div className="ls-bat-row">
            <span className="ls-name">{bowler.bowler?.name}</span>
            <span className="ls-bat-fig">{bowler.w}-{bowler.r}</span>
            <span className="ls-bat-sr">{bowler.o} ov · ECO {bowler.eco}</span>
          </div>
        </div>
      )}

      {thisOver.length > 0 && (
        <div className="ls-thisover">
          <span className="ls-sub">This over</span>
          <div className="ls-over-strip">{thisOver.map(ballChip)}</div>
        </div>
      )}

      <div className="ls-foot">
        <span>Partnership <strong>{partnershipRuns}</strong></span>
        {lastFow && <span>Last wkt: {lastFow.player} ({lastFow.runs}-{lastFow.wkt}, {lastFow.over} ov)</span>}
      </div>
    </div>
  )
}
