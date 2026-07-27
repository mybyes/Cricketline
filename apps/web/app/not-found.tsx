import Link from 'next/link'
import { SiteHeader } from '@/components/SiteHeader'

export default function NotFound() {
  return (
    <>
      <SiteHeader />
      <main className="container" style={{ padding: '48px 16px', maxWidth: 520 }}>
        <p className="brand-tagline" style={{ marginBottom: 8 }}>Cricket Pulse</p>
        <h1 style={{ fontFamily: 'var(--display)', fontSize: '1.75rem', margin: '0 0 12px' }}>
          Page not found
        </h1>
        <p style={{ color: 'var(--muted)', marginBottom: 24, lineHeight: 1.5 }}>
          That match or page isn’t here. Head home for live scores and insights.
        </p>
        <Link href="/" className="btn-primary" style={{ display: 'inline-block' }}>
          Back to home
        </Link>
      </main>
    </>
  )
}
