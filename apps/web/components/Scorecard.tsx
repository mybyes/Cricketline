import type { InningScorecard } from '@/lib/api'

function extrasLine(e?: InningScorecard['extras']) {
  if (!e) return null
  const parts: string[] = []
  if (e.b) parts.push(`b ${e.b}`)
  if (e.lb) parts.push(`lb ${e.lb}`)
  if (e.w) parts.push(`w ${e.w}`)
  if (e.nb) parts.push(`nb ${e.nb}`)
  if (e.p) parts.push(`p ${e.p}`)
  return `${e.t}${parts.length ? ` (${parts.join(', ')})` : ''}`
}

export function Scorecard({ innings }: { innings: InningScorecard[] }) {
  if (!innings?.length) {
    return (
      <div className="empty-state">
        <p className="empty-title">Scorecard not available yet</p>
        <p className="empty-sub">Detailed batting & bowling figures appear once the innings is underway.</p>
      </div>
    )
  }

  return (
    <div className="scorecard">
      {innings.map((inn, i) => {
        const ex = extrasLine(inn.extras)
        return (
          <section key={i} className="inning-block">
            <header className="inning-head">
              <span className="inning-name">{inn.inning}</span>
              {inn.totals && (
                <span className="inning-total">
                  {inn.totals.r}/{inn.totals.w} <small>({inn.totals.o} ov)</small>
                </span>
              )}
            </header>

            {inn.batting?.length > 0 && (
              <div className="table-wrap sc-table">
                <table>
                  <thead>
                    <tr>
                      <th className="ta-left">Batter</th>
                      <th>R</th><th>B</th><th>4s</th><th>6s</th><th>SR</th>
                    </tr>
                  </thead>
                  <tbody>
                    {inn.batting.map((b, bi) => (
                      <tr key={bi}>
                        <td className="ta-left">
                          <span className="player-name">{b.batsman?.name ?? '—'}</span>
                          <span className="dismissal">{b['dismissal-text'] || 'not out'}</span>
                        </td>
                        <td className="bold">{b.r}</td>
                        <td>{b.b}</td>
                        <td>{b['4s']}</td>
                        <td>{b['6s']}</td>
                        <td>{b.sr}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {ex && <p className="sc-extras">Extras <strong>{ex}</strong></p>}
            {inn.totals && (
              <p className="sc-total">Total <strong>{inn.totals.r}/{inn.totals.w}</strong> <span>({inn.totals.o} ov, RR {(inn.totals.r / Math.max(1, Math.floor(inn.totals.o) + (inn.totals.o % 1) * 10 / 6)).toFixed(2)})</span></p>
            )}
            {inn.didNotBat && inn.didNotBat.length > 0 && (
              <p className="sc-dnb"><strong>Did not bat:</strong> {inn.didNotBat.join(', ')}</p>
            )}

            {inn.fallOfWickets && inn.fallOfWickets.length > 0 && (
              <div className="sc-fow">
                <span className="sc-fow-label">Fall of wickets</span>
                <span className="sc-fow-list">
                  {inn.fallOfWickets.map((f) => (
                    <span key={f.wkt} className="sc-fow-item"><b>{f.runs}-{f.wkt}</b> {f.player} ({f.over})</span>
                  ))}
                </span>
              </div>
            )}

            {inn.bowling?.length > 0 && (
              <div className="table-wrap sc-table sc-bowling">
                <table>
                  <thead>
                    <tr>
                      <th className="ta-left">Bowler</th>
                      <th>O</th><th>M</th><th>R</th><th>W</th><th>Econ</th>
                    </tr>
                  </thead>
                  <tbody>
                    {inn.bowling.map((bw, wi) => (
                      <tr key={wi}>
                        <td className="ta-left player-name">{bw.bowler?.name ?? '—'}</td>
                        <td>{bw.o}</td>
                        <td>{bw.m}</td>
                        <td>{bw.r}</td>
                        <td className="bold">{bw.w}</td>
                        <td>{bw.eco}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        )
      })}
    </div>
  )
}
