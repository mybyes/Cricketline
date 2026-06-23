import Link from 'next/link'
import type { DailyData } from '@/lib/api'

export function DailySection({ data }: { data: DailyData }) {
  const motd = data.matchOfTheDay
  if (!motd) return null
  const live = motd.matchStarted && !motd.matchEnded
  const score = motd.score?.map((s) => `${s.r}/${s.w}`).join(' · ')

  return (
    <section className="daily">
      <Link href={`/match/${motd.id}`} className="motd">
        <div className="motd-top">
          <span className="motd-kicker"><span className="motd-star">★</span> Match of the Day</span>
          {live ? <span className="motd-live">● LIVE</span> : <span className="motd-soon">UPCOMING</span>}
        </div>
        <h3 className="motd-teams">{motd.teams.join(' vs ')}</h3>
        <p className="motd-status">{motd.status}</p>
        {score && <p className="motd-score">{score}</p>}
        <span className="motd-cta">Predict the winner &amp; follow live →</span>
      </Link>
    </section>
  )
}
