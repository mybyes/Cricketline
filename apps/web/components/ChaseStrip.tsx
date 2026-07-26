import type { ScorecardData } from '@/lib/api'

function oversToBalls(o: number): number {
  const whole = Math.floor(o)
  return whole * 6 + Math.round((o - whole) * 10)
}

/** Thin chase / RRR line only — score & batters live in hero + Scorecard tab. */
export function ChaseStrip({ data }: { data: ScorecardData }) {
  const innings = data.scorecard ?? []
  if (innings.length < 2) return null
  const cur = innings[innings.length - 1]
  const totals = cur.totals
  if (!totals) return null

  const balls = oversToBalls(totals.o)
  const oversTotal = data.matchType?.toLowerCase() === 'odi' ? 50
    : data.matchType?.toLowerCase() === 'test' ? null
    : 20
  if (!oversTotal) return null

  const target = (innings[0].totals?.r ?? 0) + 1
  const ballsLeft = Math.max(0, oversTotal * 6 - balls)
  const need = Math.max(0, target - totals.r)
  const rrr = ballsLeft > 0 ? need / (ballsLeft / 6) : 0
  const team = cur.inning.replace(/ inning.*$/i, '')

  return (
    <p className="ls-target">
      Target <strong>{target}</strong>
      {' · '}
      {team} need <strong>{need}</strong> from {ballsLeft} balls
      {rrr > 0 ? <> · RRR <strong>{rrr.toFixed(2)}</strong></> : null}
    </p>
  )
}
