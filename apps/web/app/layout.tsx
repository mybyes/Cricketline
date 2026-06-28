import type { Metadata, Viewport } from 'next'
import { Inter, Space_Grotesk } from 'next/font/google'
import './globals.css'
import { AuthProvider } from '@/lib/auth'

export const viewport: Viewport = { themeColor: '#0a3f27' }

const inter = Inter({ subsets: ['latin'], variable: '--font-sans', display: 'swap' })
const display = Space_Grotesk({ subsets: ['latin'], weight: ['500', '600', '700'], variable: '--font-display', display: 'swap' })

const site = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://cricketfastliveline.in'

export const metadata: Metadata = {
  title: 'LiveLine Guru — Live Cricket Scores, IPL & Ball by Ball',
  description: 'Live cricket scores, ball-by-ball commentary, scorecards, fixtures, series, rankings and points tables — IPL, Tests, ODIs & T20.',
  applicationName: 'LiveLine Guru',
  keywords: [
    'live cricket line', 'cricket live line', 'live line app', 'ball by ball live',
    'live cricket score', 'cricket scorecard', 'IPL live score', 'cricket live line app',
    'fastest live cricket score', 'session and rates', 'cricket fixtures', 'points table',
  ],
  metadataBase: new URL(site),
  openGraph: {
    title: 'LiveLine Guru — Live Cricket Scores',
    description: 'Real-time cricket scores, scorecards and ball-by-ball commentary.',
    url: site,
    siteName: 'LiveLine Guru',
    locale: 'en_IN',
    type: 'website',
    images: [{ url: `${site}/og.svg`, width: 1200, height: 630, alt: 'LiveLine Guru' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'LiveLine Guru',
    description: 'Live cricket scores — IPL, Tests, ODIs & T20',
    images: [`${site}/og.svg`],
  },
  robots: { index: true, follow: true },
  alternates: { canonical: site },
  icons: { icon: '/icon.svg', shortcut: '/icon.svg', apple: '/icon.svg' },
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
