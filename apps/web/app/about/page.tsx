import type { Metadata } from 'next'
import Link from 'next/link'
import { HomeFaq } from '@/components/HomeFaq'
import { PortalLayout } from '@/components/PortalLayout'
import { BRAND_DESCRIPTION, BRAND_NAME, BRAND_POSITIONING } from '@/lib/brand'

export const metadata: Metadata = {
  title: 'About',
  description: BRAND_DESCRIPTION,
  alternates: { canonical: '/about' },
}

const faqJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'FAQPage',
  mainEntity: [
    {
      '@type': 'Question',
      name: `What is ${BRAND_NAME}?`,
      acceptedAnswer: {
        '@type': 'Answer',
        text: `${BRAND_NAME} is a free companion for ${BRAND_POSITIONING}. Ball-by-ball scores, scorecards, squads, and smart match insights.`,
      },
    },
    {
      '@type': 'Question',
      name: 'Are the win lean numbers predictions?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'No. Win lean is a deterministic estimate from the current match state. It is not a guaranteed prediction and not betting advice. See /methodology.',
      },
    },
    {
      '@type': 'Question',
      name: `Which formats does ${BRAND_NAME} cover?`,
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'IPL and other T20 leagues, ODIs, Tests, and The Hundred when matches are live, plus fixtures, results, series tables, and ICC rankings.',
      },
    },
    {
      '@type': 'Question',
      name: `Do I need an account for ${BRAND_NAME}?`,
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'No. Scores, scorecards, squads, and history are free without login. Optional Google sign-in is only for match alerts when enabled.',
      },
    },
  ],
}

export default function AboutPage() {
  return (
    <PortalLayout title={`About ${BRAND_NAME}`} subtitle={BRAND_POSITIONING}>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }} />
      <article className="seo-block">
        <p>
          {BRAND_NAME} is a free live cricket companion: ball-by-ball scores, match context, smart
          insights, scorecards, squads, and series tables. Built for fans who want to understand the
          game in seconds.
        </p>
        <p style={{ marginTop: 14 }}>
          How insights are estimated:{' '}
          <Link href="/methodology">methodology</Link>.
          {' '}Data is sourced via licensed cricket APIs. {BRAND_NAME} is not affiliated with the ICC,
          BCCI, or any franchise league.
        </p>
      </article>
      <HomeFaq />
    </PortalLayout>
  )
}
