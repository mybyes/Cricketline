import Link from 'next/link'
import { AppDownloadButton } from './AppDownloadButton'

export function SiteHeader() {
  return (
    <header className="site-header">
      <div className="container header-inner">
        <div className="brand">
          <Link href="/" className="brand-link">
            <span className="brand-icon">🏏</span>
            <div>
              <p className="brand-title">CricketFast Live Line</p>
              <p className="brand-tagline">Fastest live cricket scores &amp; scorecards</p>
            </div>
          </Link>
        </div>
        <nav className="top-nav">
          <Link href="/">Live</Link>
          <Link href="/#fixtures">Fixtures</Link>
          <Link href="/#series">Series</Link>
        </nav>
        <AppDownloadButton className="app-cta" label="Get App" comingSoonLabel="Get App" />
      </div>
    </header>
  )
}
