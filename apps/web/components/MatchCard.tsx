import type { Match } from '@/lib/api'
import { formatScore, formatTime, matchFormat, seriesLabel, teamScore } from '@/lib/format'

export function MatchCard({ match, showTime }: { match: Match; showTime?: boolean }) {
  const live = match.matchStarted && !match.matchEnded
  const s0 = teamScore(match, 0)
  const s1 = teamScore(match, 1)

  return (
    <article className="match-card">
      <div className="top">
        <span>
          <span className="badge-fmt">{matchFormat(match)}</span>
          {showTime && <span>{formatTime(match.dateTimeGMT)}</span>}
        </span>
        {live ? <span className="badge-live">LIVE</span> : match.matchEnded ? <span>RESULT</span> : <span>UPCOMING</span>}
      </div>
      <div className="scores">
        <div className="team-block">
          <div className="short">{match.teamInfo?.[0]?.shortname ?? match.teams[0]}</div>
          <div className="full">{match.teams[0]}</div>
          <div className="score">{formatScore(s0)}</div>
        </div>
        <div className="vs">v</div>
        <div className="team-block right">
          <div className="short">{match.teamInfo?.[1]?.shortname ?? match.teams[1]}</div>
          <div className="full">{match.teams[1]}</div>
          <div className="score">{formatScore(s1)}</div>
        </div>
      </div>
      <div className="status">{live ? '● ' : ''}{match.status}</div>
      <div className="meta">
        <span>{seriesLabel(match)}</span>
        <span>{match.venue}</span>
      </div>
    </article>
  )
}
