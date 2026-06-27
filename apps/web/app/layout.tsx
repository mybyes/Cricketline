import type { Metadata } from 'next'
import { Inter, Space_Grotesk } from 'next/font/google'
import './globals.css'
import { AuthProvider } from '@/lib/auth'

const inter = Inter({ subsets: ['latin'], variable: '--font-sans', display: 'swap' })
const display = Space_Grotesk({ subsets: ['latin'], weight: ['500', '600', '700'], variable: '--font-display', display: 'swap' })

const site = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://cricketfastliveline.in'

export const metadata: Metadata = {
  title: 'CricketFast Live Line — Live Cricket Scores, IPL & Ball by Ball',
  description: 'Live cricket scores, ball-by-ball commentary, scorecards, fixtures, series, rankings and points tables — IPL, Tests, ODIs & T20.',
  keywords: ['live cricket score', 'cricket live line', 'cricket scorecard', 'IPL live score', 'ball by ball'],
  metadataBase: new URL(site),
  openGraph: {
    title: 'CricketFast Live Line — Live Cricket Scores',
    description: 'Real-time cricket scores, scorecards and ball-by-ball commentary.',
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
    <html lang="en" className={`${inter.variable} ${display.variable}`}>
      <body>
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  )
}
