import { useEffect, useRef, useState } from 'react'
import EventSource from 'react-native-sse'
import type { Match } from '../types/match'
import { getApiUrl } from './api'

type ScoresFrame = { data?: Match[]; ts?: number; snapshot?: boolean }

/**
 * Real-time push for a single match. Holds one SSE connection to the backend `/stream`
 * endpoint, which broadcasts the full live-match list. When the watched match appears,
 * `onMatch` fires with its latest row. react-native-sse auto-reconnects on drop.
 *
 * Returns `connected` so the UI can show a live "streaming" indicator and lengthen its
 * polling fallback while the push channel is healthy.
 */
export function useScoreStream(matchId: string, onMatch: (m: Match) => void): boolean {
  const [connected, setConnected] = useState(false)
  // keep the latest callback without re-opening the socket on every render
  const cb = useRef(onMatch)
  cb.current = onMatch

  useEffect(() => {
    const es = new EventSource<'scores'>(`${getApiUrl()}/stream`)

    const handle = (event: { type: string; data?: string | null }) => {
      if (!event.data) return
      try {
        const body = JSON.parse(event.data) as ScoresFrame
        const m = Array.isArray(body.data) ? body.data.find((x) => x.id === matchId) : undefined
        if (m) cb.current(m)
      } catch {
        /* ignore malformed frame */
      }
    }

    // backend sends named `scores` events; also listen to default messages as a fallback
    es.addEventListener('scores', handle)
    es.addEventListener('message', handle)
    es.addEventListener('open', () => setConnected(true))
    es.addEventListener('error', () => setConnected(false))

    return () => {
      es.removeAllEventListeners()
      es.close()
      setConnected(false)
    }
  }, [matchId])

  return connected
}
