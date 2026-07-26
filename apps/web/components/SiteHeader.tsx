import Link from 'next/link'
import { AuthButton } from './AuthButton'

const NAV = [
  { href: '/', label: 'Home' },
  { href: '/matches', label: 'Matches' },
  { href: '/series', label: 'Series' },
  { href: '/fixtures', label: 'Fixtures' },
  { href: '/results', label: 'Results' },
  { href: '/rankings', label: 'Rankings' },
  { href: '/teams', label: 'Teams' },
]

/** Brand + nav only — live scores live in the Home list (ticker gets cluttered). */
export function SiteHeader() {
  return (
    <header className="site-header site-top">
      <div className="container header-inner">
        <div className="brand">
          <Link href="/" className="brand-link">
            <span className="brand-mark" aria-hidden>CP</span>
            <div>
              <p className="brand-title">Cricket Pulse</p>
              <p className="brand-tagline">Live Line &amp; AI</p>
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
        <AuthButton />
      </div>
    </header>
  )
}
