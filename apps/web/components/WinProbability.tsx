import type { ScorecardData } from '@/lib/api'
import { winProbability } from '@/lib/winProbability'

/**
 * Win-probability bar. The math lives in lib/winProbability.ts (pure + tested); this just
 * renders it. A model estimate — like ESPN's Win Probability — NOT betting odds. Renders
 * only for a defined limited-overs chase.
 */
export function WinProbability({ data }: { data: ScorecardData }) {
  const wp = winProbability(data)
  if (!wp) return null
  const { pct0, pct1 } = wp

  const short = (t: string, i: number) => data.teamInfo?.[i]?.shortname || t.split(' ').map((w) => w[0]).join('').slice(0, 3).toUpperCase()

  return (
    <div className="winprob">
      <div className="wp-head">
        <span className="wp-title">Win probability</span>
        <span className="wp-model">model estimate</span>
      </div>
      <div className="wp-bar">
        <div className="wp-fill wp-a" style={{ width: `${pct0}%` }} />
        <div className="wp-fill wp-b" style={{ width: `${pct1}%` }} />
      </div>
      <div className="wp-labels">
        <span><strong>{pct0}%</strong> {short(data.teams[0], 0)}</span>
        <span>{short(data.teams[1], 1)} <strong>{pct1}%</strong></span>
      </div>
    </div>
  )
}
