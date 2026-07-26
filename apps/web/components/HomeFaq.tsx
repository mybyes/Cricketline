/** FAQ — lives on /about, not the home page. */
export function HomeFaq() {
  return (
    <section className="faq" aria-labelledby="faq-title">
      <h2 id="faq-title">FAQ</h2>
      <div className="faq-grid">
        <div>
          <h3>What is Live Line?</h3>
          <p>
            Live Line shows ball-by-ball score updates with display-only match rates and the next session
            market — for information only. We do not accept bets or wagers.
          </p>
        </div>
        <div>
          <h3>Which formats are covered?</h3>
          <p>
            IPL and other T20 leagues, ODIs, Tests, and The Hundred when matches are live. Browse fixtures,
            results, series tables, and ICC rankings anytime.
          </p>
        </div>
        <div>
          <h3>Do I need an account?</h3>
          <p>
            No. Scores, scorecards, squads, and history are free without login. Optional Google sign-in is
            only for match alerts when enabled.
          </p>
        </div>
        <div>
          <h3>Is there an Android app?</h3>
          <p>
            Yes — Cricket Pulse for Android mirrors the Live Line experience. Web stays the SEO surface for
            search; the app is for faster follow-along during play.
          </p>
        </div>
      </div>
    </section>
  )
}
