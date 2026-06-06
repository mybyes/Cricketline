import Link from 'next/link'

export function SiteHeader() {
  return (
    <header className="site-header">
      <div className="container header-inner">
        <div className="brand">
          <Link href="/" className="brand-link">
            <span className="brand-icon">🏏</span>
            <div>
              <h1>CricketFast Live Line</h1>
              <p>Fastest live cricket scores &amp; scorecards</p>
            </div>
          </Link>
        </div>
        <nav className="top-nav">
          <Link href="/">Live</Link>
          <Link href="/#fixtures">Fixtures</Link>
          <Link href="/#series">Series</Link>
          <Link href="/#rankings">Rankings</Link>
        </nav>
        <a className="app-cta" href="#download">Get App</a>
      </div>
    </header>
  )
}
