'use client'

import { useEffect, useRef } from 'react'

/**
 * Bandwidth-friendly polling for low/metered connections:
 *  - only fetches while the tab is visible (no background re-downloads)
 *  - refreshes once immediately when the user returns to the tab
 *  - pauses when offline, resumes on reconnect
 *  - backs off to a much slower interval on Save-Data or a 2G link
 *
 * Replaces a bare setInterval. The callback is held in a ref so a changing
 * closure doesn't tear down and recreate the timer.
 */
export function usePolling(fn: () => void, baseInterval: number) {
  const saved = useRef(fn)
  saved.current = fn

  useEffect(() => {
    if (typeof document === 'undefined') return

    const conn = (navigator as unknown as { connection?: { saveData?: boolean; effectiveType?: string } }).connection
    const thrifty = !!conn?.saveData || /(^|\s)(slow-2g|2g)(\s|$)/.test(conn?.effectiveType ?? '')
    const interval = thrifty ? baseInterval * 4 : baseInterval

    let timer: ReturnType<typeof setInterval> | null = null
    const stop = () => { if (timer) { clearInterval(timer); timer = null } }
    const start = () => {
      if (timer || document.visibilityState !== 'visible' || navigator.onLine === false) return
      timer = setInterval(() => {
        if (document.visibilityState === 'visible' && navigator.onLine !== false) saved.current()
      }, interval)
    }

    const onVisible = () => {
      if (document.visibilityState === 'visible') { saved.current(); start() }
      else stop()
    }

    start()
    document.addEventListener('visibilitychange', onVisible)
    window.addEventListener('online', start)
    window.addEventListener('offline', stop)
    return () => {
      stop()
      document.removeEventListener('visibilitychange', onVisible)
      window.removeEventListener('online', start)
      window.removeEventListener('offline', stop)
    }
  }, [baseInterval])
}
