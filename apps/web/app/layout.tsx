import type { Metadata } from 'next'
import './globals.css'

const site = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://cricketfastliveline.in'

export const metadata: Metadata = {
  title: 'CricketFast Live Line — Live Cricket Scores, IPL & Ball by Ball',
  description: 'Live cricket scores, ball-by-ball updates, scorecards, fixtures and points tables. Free cricket live line — IPL, Tests, ODIs & T20.',
  keywords: ['live cricket score', 'cricket live line', 'cricket scorecard', 'IPL live score', 'ball by ball'],
  metadataBase: new URL(site),
  openGraph: {
    title: 'CricketFast Live Line — Live Cricket Scores',
    description: 'Real-time cricket scores and scorecards. No login required.',
    url: site,
    siteName: 'CricketFast',
    locale: 'en_IN',
    type: 'website',
    images: [{ url: `${site}/og.svg`, width: 1200, height: 630, alt: 'CricketFast Live Line' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'CricketFast Live Line',
    description: 'Live cricket scores — IPL, Tests, ODIs & T20',
    images: [`${site}/og.svg`],
  },
  robots: { index: true, follow: true },
  alternates: { canonical: site },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
