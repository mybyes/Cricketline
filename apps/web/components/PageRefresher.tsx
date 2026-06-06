'use client'

import { useRouter } from 'next/navigation'
import { useEffect } from 'react'

/** Re-fetches server components (sidebar series, etc.) while LiveScoresPanel polls the API directly. */
export function PageRefresher({ intervalMs = 15_000 }: { intervalMs?: number }) {
  const router = useRouter()

  useEffect(() => {
    const id = setInterval(() => router.refresh(), intervalMs)
    return () => clearInterval(id)
  }, [router, intervalMs])

  return null
}
