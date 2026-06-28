'use client'

import { useRouter } from 'next/navigation'
import { usePolling } from '@/lib/usePolling'

/** Re-fetches server components (sidebar series, etc.) while LiveScoresPanel polls the API directly. */
export function PageRefresher({ intervalMs = 15_000 }: { intervalMs?: number }) {
  const router = useRouter()
  // Visibility/Save-Data aware: no full-page RSC re-fetch while the tab is hidden.
  usePolling(() => router.refresh(), intervalMs)
  return null
}
