import Link from 'next/link'

type Row = { href: string; label: string; external?: boolean }

function Section({ title, rows }: { title: string; rows: Row[] }) {
  return (
    <section className="more-section">
      <h2 className="more-label">{title}</h2>
      <ul className="more-card">
        {rows.map((r) => (
          <li key={r.href + r.label}>
            {r.external ? (
              <a href={r.href} target="_blank" rel="noopener noreferrer" className="more-row">
                <span>{r.label}</span>
                <span className="more-chev" aria-hidden>›</span>
              </a>
            ) : (
              <Link href={r.href} className="more-row">
                <span>{r.label}</span>
                <span className="more-chev" aria-hidden>›</span>
              </Link>
            )}
          </li>
        ))}
      </ul>
    </section>
  )
}

/** CG-style More hub — legal, browse, follow. Keeps home free of footer chrome. */
export function MoreMenu() {
  return (
    <div className="more-menu">
      <Section
        title="Browse cricket"
        rows={[
          { href: '/matches', label: 'All matches' },
          { href: '/series', label: 'Series' },
          { href: '/fixtures', label: 'Fixtures' },
          { href: '/results', label: 'Results' },
          { href: '/rankings', label: 'ICC rankings' },
          { href: '/teams', label: 'Teams' },
        ]}
      />
      <Section
        title="Follow us"
        rows={[
          { href: 'https://x.com/ChaiPeCric', label: 'X · @ChaiPeCric', external: true },
        ]}
      />
      <Section
        title="Info & legal"
        rows={[
          { href: '/about', label: 'About Cricket Pulse' },
          { href: '/privacy', label: 'Privacy policy' },
          { href: '/terms', label: 'Terms of use' },
        ]}
      />
      <p className="more-version">
        Cricket Pulse · Live Line &amp; AI
        <br />
        Display-only markets · Not affiliated with ICC or BCCI
      </p>
    </div>
  )
}
