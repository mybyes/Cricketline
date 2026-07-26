import type { Metadata } from 'next'
import { HomeFaq } from '@/components/HomeFaq'
import { PortalLayout } from '@/components/PortalLayout'

export const metadata: Metadata = {
  title: 'About',
  description:
    'Cricket Pulse – Live Line & AI: free live cricket scores, display-only markets, scorecards and fixtures. Not a betting service.',
  alternates: { canonical: '/about' },
}

const faqJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'FAQPage',
  mainEntity: [
    {
      '@type': 'Question',
      name: 'What is Live Line on Cricket Pulse?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Live Line shows ball-by-ball score updates with display-only match rates and the next session market for information only. Cricket Pulse does not accept bets or wagers.',
      },
    },
    {
      '@type': 'Question',
      name: 'Which cricket formats does Cricket Pulse cover?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'IPL and other T20 leagues, ODIs, Tests, and The Hundred when matches are live, plus fixtures, results, series tables, and ICC rankings.',
      },
    },
    {
      '@type': 'Question',
      name: 'Do I need an account for Cricket Pulse?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'No. Scores, scorecards, squads, and history are free without login. Optional Google sign-in is only for match alerts when enabled.',
      },
    },
  ],
}

export default function AboutPage() {
  return (
    <PortalLayout title="About Cricket Pulse" subtitle="Live Line & AI — scores without the noise">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }} />
      <article className="seo-block">
        <p>
          Cricket Pulse is a free live cricket companion: ball-by-ball scores, scorecards, squads, series
          tables, and display-only match &amp; session rates. Built for fans who want a fast Live Line —
          not a betting desk.
        </p>
        <p style={{ marginTop: 14 }}>
          Markets shown are informational only. We do not take wagers, process payments for betting, or
          partner with bookmakers for stake placement.
        </p>
        <p style={{ marginTop: 14 }}>
          Data is sourced via licensed cricket APIs. Cricket Pulse is not affiliated with the ICC, BCCI,
          or any franchise league.
        </p>
      </article>
      <HomeFaq />
    </PortalLayout>
  )
}
