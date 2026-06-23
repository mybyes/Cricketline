'use client'

import { useCallback, useEffect, useState } from 'react'
import { getPublicApiUrl } from '@/lib/apiUrl'

const API = getPublicApiUrl()

function getDeviceId(): string {
  try {
    let id = localStorage.getItem('cf_device_id')
    if (!id) {
      id = 'web-' + (crypto.randomUUID?.() ?? Math.random().toString(36).slice(2) + Date.now())
      localStorage.setItem('cf_device_id', id)
    }
    return id
  } catch {
    return 'web-anon'
  }
}

interface Poll { counts: [number, number]; total: number; your: 0 | 1 | null }

function todayKey(): string {
  const d = new Date()
  return `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`
}

/** CRED-style daily streak — counts consecutive days the user made a prediction. */
function bumpStreak(): number {
  try {
    const raw = JSON.parse(localStorage.getItem('cf_streak') || '{}') as { count?: number; last?: string }
    const today = todayKey()
    if (raw.last === today) return raw.count ?? 1
    const y = new Date(); y.setDate(y.getDate() - 1)
    const yKey = `${y.getFullYear()}-${y.getMonth() + 1}-${y.getDate()}`
    const count = raw.last === yKey ? (raw.count ?? 0) + 1 : 1
    localStorage.setItem('cf_streak', JSON.stringify({ count, last: today }))
    return count
  } catch { return 1 }
}
function readStreak(): number {
  try {
    const raw = JSON.parse(localStorage.getItem('cf_streak') || '{}') as { count?: number; last?: string }
    return raw.last === todayKey() ? (raw.count ?? 0) : 0
  } catch { return 0 }
}

export function PredictionPoll({ matchId, teams }: { matchId: string; teams: [string, string] }) {
  const [poll, setPoll] = useState<Poll | null>(null)
  const [busy, setBusy] = useState(false)
  const [streak, setStreak] = useState(0)
  const revealed = !!poll && poll.your !== null

  useEffect(() => { setStreak(readStreak()) }, [])

  const load = useCallback(async () => {
    try {
      const res = await fetch(`${API}/match/${matchId}/poll?device_id=${encodeURIComponent(getDeviceId())}`, { cache: 'no-store' })
      const body = await res.json()
      if (body.success) setPoll(body.data)
    } catch { /* ignore */ }
  }, [matchId])

  useEffect(() => { load() }, [load])

  async function cast(choice: 0 | 1) {
    if (busy) return
    setBusy(true)
    try {
      const res = await fetch(`${API}/match/${matchId}/poll`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ device_id: getDeviceId(), choice }),
      })
      const body = await res.json()
      if (body.success) { setPoll(body.data); setStreak(bumpStreak()) }
    } catch { /* ignore */ } finally { setBusy(false) }
  }

  const total = poll?.total ?? 0
  const pct = (i: 0 | 1) => (total > 0 ? Math.round(((poll?.counts[i] ?? 0) / total) * 100) : 0)

  return (
    <div className="poll">
      <div className="poll-head">
        <div className="poll-head-row">
          <span className="poll-kicker"><span className="poll-live-dot" /> Match Pulse</span>
          {streak > 0 && <span className="poll-streak">🔥 {streak}-day streak</span>}
        </div>
        <span className="poll-q">Who wins this one?</span>
      </div>

      <div className="poll-options">
        {([0, 1] as const).map((i) => {
          const picked = poll?.your === i
          const winning = revealed && pct(i) >= pct(i === 0 ? 1 : 0)
          return (
            <button
              key={i}
              className={`poll-opt ${picked ? 'poll-opt-picked' : ''} ${revealed ? 'poll-opt-revealed' : ''}`}
              onClick={() => cast(i)}
              disabled={busy}
            >
              {revealed && (
                <span
                  className={`poll-fill ${winning ? 'poll-fill-win' : ''}`}
                  style={{ width: `${pct(i)}%` }}
                />
              )}
              <span className="poll-opt-body">
                <span className="poll-team">{teams[i]}</span>
                {revealed ? (
                  <span className="poll-pct">{pct(i)}%</span>
                ) : (
                  <span className="poll-tap">Tap to predict</span>
                )}
              </span>
              {picked && <span className="poll-badge">Your pick</span>}
            </button>
          )
        })}
      </div>

      <div className="poll-foot">
        {revealed ? (
          <>
            <span>{total.toLocaleString()} {total === 1 ? 'fan has' : 'fans have'} voted</span>
            <button className="poll-change" onClick={() => setPoll((p) => (p ? { ...p, your: null } : p))}>
              Change pick
            </button>
          </>
        ) : (
          <span>Vote to reveal what fans think</span>
        )}
      </div>
    </div>
  )
}
