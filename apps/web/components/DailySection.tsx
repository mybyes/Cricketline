import Link from 'next/link'
import type { DailyData } from '@/lib/api'

function shortOf(teams: string[], teamInfo: { shortname?: string }[] | undefined, i: number) {
  return teamInfo?.[i]?.shortname
    || teams[i]?.split(' ').map((w) => w[0]).join('').slice(0, 3).toUpperCase()
    || `T${i + 1}`
}

export function DailySection({ data }: { data: DailyData }) {
  const motd = data.matchOfTheDay
  if (!motd) return null
  const live = motd.matchStarted && !motd.matchEnded
  const a = shortOf(motd.teams, motd.teamInfo, 0)
  const b = shortOf(motd.teams, motd.teamInfo, 1)
  const score = motd.score?.map((s) => `${s.r}/${s.w}`).join(' · ')

  return (
    <section className="daily">
      <Link href={`/match/${motd.id}`} className="motd" title={motd.teams.join(' vs ')}>
        <div className="motd-top">
          <span className="motd-kicker">Match of the day</span>
          {live ? <span className="motd-live">LIVE</span> : <span className="motd-soon">UP</span>}
        </div>
        <div className="motd-main">
          <h3 className="motd-teams">{a} <span>vs</span> {b}</h3>
          {score ? <span className="motd-score">{score}</span> : null}
        </div>
        <p className="motd-status">{motd.status}</p>
      </Link>
    </section>
  )
}
