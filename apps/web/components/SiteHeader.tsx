import Link from 'next/link'
import { AuthButton } from './AuthButton'
import { BRAND_NAME, BRAND_TAGLINE } from '@/lib/brand'

/** Desktop: keep primary nav lean — Fixtures/Results/Teams live under More. */
const NAV = [
  { href: '/', label: 'Home' },
  { href: '/matches', label: 'Matches' },
  { href: '/series', label: 'Series' },
  { href: '/rankings', label: 'Rankings' },
  { href: '/more', label: 'More' },
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
              <p className="brand-title">{BRAND_NAME}</p>
              <p className="brand-tagline">{BRAND_TAGLINE}</p>
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
