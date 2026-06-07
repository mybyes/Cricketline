import Link from 'next/link'
import { AppDownloadButton } from './AppDownloadButton'

export function SiteHeader() {
  return (
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
          <Link href="/">Live</Link>
          <Link href="/#fixtures">Fixtures</Link>
          <Link href="/#series">Series</Link>
        </nav>
        <AppDownloadButton className="app-cta" label="Get App" comingSoonLabel="Get App" />
      </div>
    </header>
  )
}
