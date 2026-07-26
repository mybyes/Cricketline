import { useEffect, useRef, useState } from 'react'
import EventSource from 'react-native-sse'
import type { Match } from '../types/match'
import type { MatchOddsBoard } from '../types/odds'
import { fetchMatchOdds, getApiUrl } from './api'

type ScoresFrame = { data?: Match[]; ts?: number }
type OddsFrame = { data?: MatchOddsBoard[]; ts?: number }

/**
 * One SSE connection for both scores + display-only odds (lightweight).
 * Falls back to REST polling for odds if the stream drops.
 */
export function useLiveStream(
  matchId: string,
  onMatch: (m: Match) => void,
): { connected: boolean; odds: MatchOddsBoard | null } {
  const [connected, setConnected] = useState(false)
  const [odds, setOdds] = useState<MatchOddsBoard | null>(null)
  const matchCb = useRef(onMatch)
  matchCb.current = onMatch
  const matchIdRef = useRef(matchId)
  matchIdRef.current = matchId

  useEffect(() => {
    let alive = true
    let poll: ReturnType<typeof setInterval> | null = null

    const pullOdds = async () => {
      const res = await fetchMatchOdds(matchId)
      if (alive && res.success && res.data) setOdds(res.data)
    }
    void pullOdds()

    const es = new EventSource<'scores' | 'odds'>(`${getApiUrl()}/stream`)

    const onScores = (event: { type: string; data?: string | null }) => {
      if (!event.data) return
      try {
        const body = JSON.parse(event.data) as ScoresFrame
        const m = Array.isArray(body.data) ? body.data.find((x) => x.id === matchIdRef.current) : undefined
        if (m) matchCb.current(m)
      } catch { /* ignore */ }
    }

    const onOdds = (event: { type: string; data?: string | null }) => {
      if (!event.data) return
      try {
        const body = JSON.parse(event.data) as OddsFrame
        const hit = Array.isArray(body.data)
          ? body.data.find((x) => x.matchId === matchIdRef.current)
          : undefined
        if (hit) setOdds(hit)
      } catch { /* ignore */ }
    }

    es.addEventListener('scores', onScores)
    es.addEventListener('odds', onOdds)
    es.addEventListener('message', onScores)
    es.addEventListener('open', () => {
      setConnected(true)
      if (poll) { clearInterval(poll); poll = null }
    })
    es.addEventListener('error', () => {
      setConnected(false)
      if (!poll) poll = setInterval(() => { void pullOdds() }, 5_000)
    })

    return () => {
      alive = false
      es.removeAllEventListeners()
      es.close()
      if (poll) clearInterval(poll)
      setConnected(false)
    }
  }, [matchId])

  return { connected, odds }
}
