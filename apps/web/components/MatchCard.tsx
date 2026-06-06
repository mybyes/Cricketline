import type { Match } from '@/lib/api'
import { formatScore, formatTime, matchFormat, seriesLabel, teamScore } from '@/lib/format'

export function MatchCard({ match, showTime, compact }: { match: Match; showTime?: boolean; compact?: boolean }) {
  const live = match.matchStarted && !match.matchEnded
  const s0 = teamScore(match, 0)
  const s1 = teamScore(match, 1)
  const logo0 = match.teamInfo?.[0]?.img
  const logo1 = match.teamInfo?.[1]?.img

  return (
    <article className={`match-card ${live ? 'match-live' : ''} ${compact ? 'match-compact' : ''}`}>
      <div className="top">
        <span className="top-left">
          {live && <span className="badge-live">LIVE</span>}
          <span className="badge-fmt">{matchFormat(match)}</span>
          {showTime && <span className="match-time">{formatTime(match.dateTimeGMT)}</span>}
        </span>
        {!live && (
          <span className="badge-status">{match.matchEnded ? 'RESULT' : 'UPCOMING'}</span>
        )}
      </div>
      <div className="scores">
        <div className="team-block">
          <div className="team-top">
            {logo0 ? <img src={logo0} alt="" className="team-logo" width={32} height={32} /> : <span className="logo-ph" />}
            <div>
              <div className="short">{match.teamInfo?.[0]?.shortname ?? match.teams[0]}</div>
              {!compact && <div className="full">{match.teams[0]}</div>}
            </div>
          </div>
          <div className={`score ${s0 ? 'score-on' : ''}`}>{formatScore(s0)}</div>
        </div>
        <div className="vs">VS</div>
        <div className="team-block right">
          <div className="team-top team-top-right">
            <div>
              <div className="short">{match.teamInfo?.[1]?.shortname ?? match.teams[1]}</div>
              {!compact && <div className="full">{match.teams[1]}</div>}
            </div>
            {logo1 ? <img src={logo1} alt="" className="team-logo" width={32} height={32} /> : <span className="logo-ph" />}
          </div>
          <div className={`score ${s1 ? 'score-on' : ''}`}>{formatScore(s1)}</div>
        </div>
      </div>
      <div className={`status ${live ? 'status-live' : ''}`}>{live ? '● ' : ''}{match.status}</div>
      <div className="meta">
        <span>{seriesLabel(match)}</span>
        <span>{match.venue}</span>
      </div>
    </article>
  )
}
