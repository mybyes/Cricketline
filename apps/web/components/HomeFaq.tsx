/** FAQ — lives on /about, not the home page. */
export function HomeFaq() {
  return (
    <section className="faq" aria-labelledby="faq-title">
      <h2 id="faq-title">FAQ</h2>
      <div className="faq-grid">
        <div>
          <h3>What is Cricket Pulse?</h3>
          <p>
            A free companion for live cricket scores, match context, and smart insights — plus
            scorecards, squads, and series tables.
          </p>
        </div>
        <div>
          <h3>Are insights predictions?</h3>
          <p>
            No. Win lean and pressure are deterministic estimates from the current match state —
            not guaranteed outcomes and not betting advice. See How insights work.
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
      </div>
    </section>
  )
}
