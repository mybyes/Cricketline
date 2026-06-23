import Link from 'next/link'
import { AppDownloadButton } from './AppDownloadButton'
import { TopMatchesBar } from './TopMatchesBar'

const NAV = [
  { href: '/', label: 'Live' },
  { href: '/matches', label: 'Matches' },
  { href: '/series', label: 'Series' },
  { href: '/fixtures', label: 'Fixtures' },
  { href: '/results', label: 'Results' },
  { href: '/rankings', label: 'Rankings' },
  { href: '/teams', label: 'Teams' },
]

export function SiteHeader() {
  return (
    <div className="site-top">
      <header className="site-header">
      <div className="container header-inner">
        <div className="brand">
          <Link href="/" className="brand-link">
            <span className="brand-mark" aria-hidden>CF</span>
            <div>
              <p className="brand-title">CricketFast</p>
              <p className="brand-tagline">Live scores &amp; live line</p>
            </div>
          </Link>
        </div>
        <nav className="top-nav" aria-label="Main">
          {NAV.map((n) => <Link key={n.href} href={n.href}>{n.label}</Link>)}
        </nav>
        <form className="header-search" action="/search" role="search">
          <input type="search" name="q" placeholder="Search teams, series…" aria-label="Search" minLength={2} />
          <button type="submit" aria-label="Search">⌕</button>
        </form>
        <AppDownloadButton className="app-cta" label="Get App" comingSoonLabel="Get App" />
      </div>
      </header>
      <TopMatchesBar />
    </div>
  )
}
