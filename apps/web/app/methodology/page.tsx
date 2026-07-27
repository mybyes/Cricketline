import type { Metadata } from 'next'
import Link from 'next/link'
import { PortalLayout } from '@/components/PortalLayout'
import { BRAND_NAME } from '@/lib/brand'
import { getSiteUrl } from '@/lib/site'

export const metadata: Metadata = {
  title: 'How match insights work',
  description:
    'How Cricket Pulse estimates win lean, pressure, and momentum — deterministic rules, not betting tips or guaranteed predictions.',
  alternates: { canonical: `${getSiteUrl()}/methodology` },
}

export default function MethodologyPage() {
  return (
    <PortalLayout
      title="How insights work"
      subtitle="Estimates from the match state — not predictions, not tips"
    >
      <article className="seo-block">
        <p>
          {BRAND_NAME} insights are produced by a deterministic rules engine (CIE) that reads the
          current scorecard and recent balls. There is no machine-learning model and no wagering advice.
        </p>

        <h2>What you see</h2>
        <p>
          <strong>Match story</strong> — a short plain-language read of the situation.<br />
          <strong>Win lean</strong> — an estimate of which side is ahead right now (not a prediction).<br />
          <strong>Pressure &amp; momentum</strong> — how tight the situation feels, and who is dictating tempo.<br />
          <strong>Turning point</strong> — one recent moment that shifted control.
        </p>

        <h2>What we do not claim</h2>
        <p>
          We do not guarantee outcomes. Insights are estimates from the current match state.
        </p>

        <h2>Freshness</h2>
        <p>
          Insights refresh when the score or ball-by-ball feed changes. If the data provider is slow,
          you may see a stale banner — scores and insights share the same cache layer.
        </p>

        <p style={{ marginTop: 14 }}>
          <Link href="/more">More</Link>
          {' · '}
          <Link href="/about">About {BRAND_NAME}</Link>
        </p>
      </article>
    </PortalLayout>
  )
}
