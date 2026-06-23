import Link from 'next/link'
import type { ReactNode } from 'react'
import { AdSlot } from './AdSlot'
import { Breadcrumbs, type Crumb } from './Breadcrumbs'
import { PageRefresher } from './PageRefresher'
import { SiteFooter } from './SiteFooter'
import { SiteHeader } from './SiteHeader'

const EXPLORE = [
  { href: '/matches', label: 'All matches' },
  { href: '/series', label: 'Series' },
  { href: '/fixtures', label: 'Fixtures' },
  { href: '/results', label: 'Results' },
  { href: '/rankings', label: 'ICC Rankings' },
  { href: '/teams', label: 'Teams' },
]

export function PortalLayout({
  title, subtitle, children, refresh, crumbs,
}: { title: string; subtitle?: string; children: ReactNode; refresh?: boolean; crumbs?: Crumb[] }) {
  return (
    <>
      {refresh && <PageRefresher intervalMs={20_000} />}
      <SiteHeader />
      <div className="page-head">
        <div className="container">
          {crumbs && crumbs.length > 0 && <Breadcrumbs items={crumbs} />}
          <h1 className="page-title">{title}</h1>
          {subtitle && <p className="page-sub">{subtitle}</p>}
        </div>
      </div>
      <div className="container">
        <AdSlot id="top" format="leaderboard" />
      </div>
      <div className="container page-layout">
        <main className="main-col">{children}</main>
        <aside className="sidebar">
          <div className="widget">
            <div className="widget-head">Explore</div>
            <div className="widget-body">
              <nav className="explore-nav">
                {EXPLORE.map((e) => <Link key={e.href} href={e.href}>{e.label}</Link>)}
              </nav>
            </div>
          </div>
          <AdSlot id="sidebar" format="sidebar" />
        </aside>
      </div>
      <SiteFooter />
    </>
  )
}
