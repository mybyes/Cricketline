import type { Metadata } from 'next'
import Link from 'next/link'
import { PortalLayout } from '@/components/PortalLayout'
import { getTeams, type TeamCategory, type TeamSummary } from '@/lib/api'

export const revalidate = 600

export const metadata: Metadata = {
  title: 'Cricket Teams — International, Leagues & Domestic | LiveLine Guru',
  description: 'Browse cricket teams by category — international sides, T20 league franchises and domestic teams — with live scores, fixtures and results.',
  alternates: { canonical: '/teams' },
}

const GROUPS: { key: TeamCategory; label: string }[] = [
  { key: 'international', label: 'International' },
  { key: 'league', label: 'Leagues' },
  { key: 'other', label: 'Domestic & Others' },
]

function TeamCardList({ teams }: { teams: TeamSummary[] }) {
  return (
    <div className="teams-grid">
      {teams.map((t) => (
        <Link key={t.name} href={`/team/${encodeURIComponent(t.name)}`} className="team-card">
          <span className="team-badge-fallback team-card-badge" style={{ width: 44, height: 44, fontSize: 14, background: 'var(--green)' }}>{t.short}</span>
          <span className="team-card-name">{t.name}</span>
          <span className="team-card-meta">
            {t.live > 0 && <span className="team-card-live">● {t.live} live</span>}
            <span>{t.matches} match{t.matches === 1 ? '' : 'es'}</span>
          </span>
        </Link>
      ))}
    </div>
  )
}

export default async function TeamsPage() {
  const { data } = await getTeams()
  const teams = Array.isArray(data) ? data : []
  const grouped = GROUPS.map((g) => ({ ...g, teams: teams.filter((t) => t.category === g.key) })).filter((g) => g.teams.length)

  return (
    <PortalLayout title="Teams" subtitle="By international, leagues & domestic">
      {teams.length === 0 ? (
        <div className="empty-state"><p className="empty-title">No teams to show yet</p></div>
      ) : (
        grouped.map((g) => (
          <section key={g.key} className="team-group">
            <h2 className="section-title">{g.label} <span className="team-group-count">{g.teams.length}</span></h2>
            <TeamCardList teams={g.teams} />
          </section>
        ))
      )}
    </PortalLayout>
  )
}
