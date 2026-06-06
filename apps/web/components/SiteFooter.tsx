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
          <p><a href="/">Live Scores</a> · <a href="/#fixtures">Fixtures</a> · <a href="/#series">Series</a></p>
        </div>
        <div>
          <strong>Get the App</strong>
          <p>Android &amp; iOS — live line, session, squad, history, table</p>
        </div>
      </div>
      <div className="container footer-copy">
        <p>© {new Date().getFullYear()} CricketFast · cricketfastliveline.in</p>
        <p>Data via CricAPI · Not affiliated with ICC or BCCI</p>
      </div>
    </footer>
  )
}
