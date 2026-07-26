import { useEffect, useRef, useState } from 'react'
import EventSource from 'react-native-sse'
import type { MatchOddsBoard } from '../types/odds'
import { fetchMatchOdds, getApiUrl } from './api'

type OddsFrame = { data?: MatchOddsBoard[]; ts?: number; snapshot?: boolean }

/**
 * Live display-only odds for one match. Prefers SSE `odds` events; polls REST as fallback.
 */
export function useOddsStream(matchId: string): {
  board: MatchOddsBoard | null
  connected: boolean
} {
  const [board, setBoard] = useState<MatchOddsBoard | null>(null)
  const [connected, setConnected] = useState(false)
  const matchIdRef = useRef(matchId)
  matchIdRef.current = matchId

  useEffect(() => {
    let alive = true
    let poll: ReturnType<typeof setInterval> | null = null

    const apply = (next: MatchOddsBoard | null | undefined) => {
      if (!alive || !next || next.matchId !== matchIdRef.current) return
      setBoard(next)
    }

    const pull = async () => {
      const res = await fetchMatchOdds(matchId)
      if (res.success && res.data) apply(res.data)
    }

    void pull()

    const es = new EventSource<'scores' | 'odds'>(`${getApiUrl()}/stream`)

    const onOdds = (event: { type: string; data?: string | null }) => {
      if (!event.data) return
      try {
        const body = JSON.parse(event.data) as OddsFrame
        const hit = Array.isArray(body.data)
          ? body.data.find((x) => x.matchId === matchIdRef.current)
          : undefined
        if (hit) apply(hit)
      } catch { /* ignore */ }
    }

    es.addEventListener('odds', onOdds)
    es.addEventListener('open', () => {
      setConnected(true)
      if (poll) { clearInterval(poll); poll = null }
    })
    es.addEventListener('error', () => {
      setConnected(false)
      if (!poll) poll = setInterval(() => { void pull() }, 5_000)
    })

    return () => {
      alive = false
      es.removeAllEventListeners()
      es.close()
      if (poll) clearInterval(poll)
      setConnected(false)
    }
  }, [matchId])

  return { board, connected }
}
