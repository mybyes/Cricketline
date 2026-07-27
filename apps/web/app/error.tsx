'use client'

import { useEffect } from 'react'
import Link from 'next/link'

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error(error)
  }, [error])

  return (
    <main className="container" style={{ padding: '48px 16px', maxWidth: 520 }}>
      <h1 style={{ fontFamily: 'var(--display)', fontSize: '1.5rem', margin: '0 0 12px' }}>
        Something went wrong
      </h1>
      <p style={{ color: 'var(--muted)', marginBottom: 20, lineHeight: 1.5 }}>
        We couldn’t load this page. Try again — live scores usually recover quickly.
      </p>
      <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
        <button type="button" className="btn-primary" onClick={() => reset()}>
          Try again
        </button>
        <Link href="/">Home</Link>
      </div>
    </main>
  )
}
