import { MatchGrid } from '@/components/MatchGrid'
import type { Match, MatchHistoryData } from '@/lib/api'

function formChips(team: string, matches: Match[]) {
  return matches.slice(0, 5).map((m, i) => {
    const won = new RegExp(`${team.split(' ')[0]}`, 'i').test(m.status) && /won/i.test(m.status)
    const noResult = /no result|abandon|draw|tie/i.test(m.status)
    const r = noResult ? 'N' : won ? 'W' : 'L'
    return <span key={i} className={`form-chip form-${r}`}>{r}</span>
  })
}

export function HeadToHead({ data, teams }: { data: MatchHistoryData; teams: string[] }) {
  const h2h = data.headToHead ?? []
  const t1 = teams[0]
  const t2 = teams[1]
  const noData = !h2h.length && !data.team1Recent?.length && !data.team2Recent?.length

  if (noData) {
    return (
      <div className="empty-state">
        <p className="empty-title">No head-to-head history yet</p>
        <p className="empty-sub">Past meetings and recent form will appear here.</p>
      </div>
    )
  }

  return (
    <div className="h2h">
      <div className="form-row">
        {[{ name: t1, m: data.team1Recent ?? [] }, { name: t2, m: data.team2Recent ?? [] }].map((side) => (
          <div key={side.name} className="form-card">
            <span className="form-team">{side.name}</span>
            <span className="form-chips">{side.m.length ? formChips(side.name, side.m) : <span className="form-none">No recent results</span>}</span>
          </div>
        ))}
      </div>

      {h2h.length > 0 && (
        <>
          <h3 className="m-sub">Recent meetings</h3>
          <MatchGrid matches={h2h} showTime />
        </>
      )}
    </div>
  )
}
