import type { Metadata, Viewport } from 'next'
import { Fraunces, IBM_Plex_Mono, IBM_Plex_Sans } from 'next/font/google'
import './globals.css'
import { BottomNav } from '@/components/BottomNav'
import { AuthProvider } from '@/lib/auth'
import { getSiteUrl } from '@/lib/site'

export const viewport: Viewport = { themeColor: '#163528' }

const sans = IBM_Plex_Sans({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-sans',
  display: 'swap',
})
const display = Fraunces({
  subsets: ['latin'],
  weight: ['500', '600', '700'],
  variable: '--font-display',
  display: 'swap',
})
const mono = IBM_Plex_Mono({
  subsets: ['latin'],
  weight: ['500', '600', '700'],
  variable: '--font-mono',
  display: 'swap',
})

const site = getSiteUrl()

export const metadata: Metadata = {
  title: {
    default: 'Cricket Pulse – Live Line & AI',
    template: '%s | Cricket Pulse',
  },
  description:
    'Cricket Pulse – Live Line & AI: real-time scores, display-only match odds & session markets, scorecards, squads and fixtures — IPL, Tests, ODIs & T20. Free, no login.',
  applicationName: 'Cricket Pulse',
  keywords: [
    'live cricket line',
    'cricket live line',
    'live line app',
    'live cricket score',
    'cricket scorecard',
    'IPL live score',
    'cricket live line app',
    'match odds',
    'session markets',
    'cricket fixtures',
    'points table',
    'T20 live score',
  ],
  metadataBase: new URL(site),
  openGraph: {
    title: 'Cricket Pulse – Live Line & AI',
    description: 'Real-time cricket live line, display-only markets, scorecards and fixtures.',
    url: site,
    siteName: 'Cricket Pulse',
    locale: 'en_IN',
    type: 'website',
    images: [{ url: `${site}/og.svg`, width: 1200, height: 630, alt: 'Cricket Pulse – Live Line & AI' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Cricket Pulse – Live Line & AI',
    description: 'Live cricket scores & display-only markets — IPL, Tests, ODIs & T20',
    images: [`${site}/og.svg`],
  },
  robots: { index: true, follow: true, googleBot: { index: true, follow: true } },
  alternates: { canonical: site },
  icons: { icon: '/icon.svg', shortcut: '/icon.svg', apple: '/icon.svg' },
  category: 'sports',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${sans.variable} ${display.variable} ${mono.variable}`} suppressHydrationWarning>
      {/* suppressHydrationWarning: browser extensions (e.g. Grammarly) inject attrs on <body> */}
      <body suppressHydrationWarning>
        <AuthProvider>
          <div className="app-shell">
            {children}
            <BottomNav />
          </div>
        </AuthProvider>
      </body>
    </html>
  )
}
