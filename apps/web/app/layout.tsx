import type { Metadata, Viewport } from 'next'
import { Fraunces, IBM_Plex_Mono, IBM_Plex_Sans } from 'next/font/google'
import './globals.css'
import { BottomNav } from '@/components/BottomNav'
import { AuthProvider } from '@/lib/auth'
import {
  BRAND_DESCRIPTION, BRAND_KEYWORDS, BRAND_NAME, BRAND_OG_DESCRIPTION,
} from '@/lib/brand'
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
    default: `${BRAND_NAME} — live cricket & smart insights`,
    template: `%s | ${BRAND_NAME}`,
  },
  description: BRAND_DESCRIPTION,
  applicationName: BRAND_NAME,
  keywords: [...BRAND_KEYWORDS],
  metadataBase: new URL(site),
  openGraph: {
    title: `${BRAND_NAME} — live cricket & smart insights`,
    description: BRAND_OG_DESCRIPTION,
    url: site,
    siteName: BRAND_NAME,
    locale: 'en_IN',
    type: 'website',
    images: [{ url: `${site}/og.svg`, width: 1200, height: 630, alt: BRAND_NAME }],
  },
  twitter: {
    card: 'summary_large_image',
    title: `${BRAND_NAME} — live cricket & smart insights`,
    description: BRAND_OG_DESCRIPTION,
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
