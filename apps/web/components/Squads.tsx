import type { SquadTeam } from '@/lib/api'

export function Squads({ squads }: { squads: SquadTeam[] }) {
  if (!squads?.length) {
    return (
      <div className="empty-state">
        <p className="empty-title">Squads not announced</p>
        <p className="empty-sub">Playing XI and squads appear closer to the toss.</p>
      </div>
    )
  }
  return (
    <div className="squads">
      {squads.map((t) => (
        <section key={t.team} className="squad-block">
          <header className="squad-head">{t.team}</header>
          <ul className="squad-list">
            {t.players.map((p) => (
              <li key={p.player.id} className="squad-player">
                <span className="squad-name">{p.player.name}</span>
                {p.role && <span className="squad-role">{p.role}</span>}
              </li>
            ))}
          </ul>
        </section>
      ))}
    </div>
  )
}
