import { AppDownloadButton } from './AppDownloadButton'

export function SiteFooter() {
  return (
    <footer className="site-footer">
      <div className="container footer-grid">
        <div>
          <strong>CricketFast Live Line</strong>
          <p>Live cricket scores, ball-by-ball updates, scorecards and fixtures.</p>
        </div>
        <div>
          <strong>Quick Links</strong>
          <p>
            <a href="/live">Live Scores</a> · <a href="/matches">Matches</a> · <a href="/series">Series</a> · <a href="/fixtures">Fixtures</a>
            <br /><a href="/results">Results</a> · <a href="/rankings">Rankings</a> · <a href="/teams">Teams</a>
          </p>
        </div>
        <div>
          <strong>Get the App</strong>
          <p>Faster live line on Android.</p>
          <AppDownloadButton />
        </div>
      </div>
      <div className="container footer-copy">
        <p>© {new Date().getFullYear()} CricketFast · cricketfastliveline.in</p>
        <p>Data via CricAPI · Not affiliated with ICC or BCCI</p>
      </div>
    </footer>
  )
}
