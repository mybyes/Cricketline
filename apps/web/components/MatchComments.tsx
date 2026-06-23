'use client'

import { useCallback, useEffect, useState } from 'react'
import { getPublicApiUrl } from '@/lib/apiUrl'

interface Comment {
  id: string
  device_id: string
  text: string
  created_at: string
  flags?: number
}

const API = getPublicApiUrl()

/** Anonymous, persistent per-browser id (no login) — mirrors the app's device-id model. */
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

function timeAgo(iso: string): string {
  const s = Math.max(1, Math.floor((Date.now() - new Date(iso).getTime()) / 1000))
  if (s < 60) return `${s}s ago`
  if (s < 3600) return `${Math.floor(s / 60)}m ago`
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`
  return `${Math.floor(s / 86400)}d ago`
}

/** Short, stable label from an anonymous device id (no identity, just a handle). */
function fanLabel(deviceId: string): string {
  let h = 0
  for (let i = 0; i < deviceId.length; i++) h = (h * 31 + deviceId.charCodeAt(i)) >>> 0
  return `Fan #${(h % 9000) + 1000}`
}

export function MatchComments({ matchId }: { matchId: string }) {
  const [comments, setComments] = useState<Comment[]>([])
  const [text, setText] = useState('')
  const [loading, setLoading] = useState(true)
  const [posting, setPosting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [disabled, setDisabled] = useState(false)

  const load = useCallback(async () => {
    try {
      const res = await fetch(`${API}/match/${matchId}/comments`, { cache: 'no-store' })
      if (res.status === 503) { setDisabled(true); return }
      const body = await res.json()
      if (body.success) setComments(body.data ?? [])
    } catch {
      /* keep whatever we have */
    } finally {
      setLoading(false)
    }
  }, [matchId])

  useEffect(() => { load() }, [load])

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    const trimmed = text.trim()
    if (trimmed.length < 2 || posting) return
    setPosting(true)
    setError(null)
    try {
      const res = await fetch(`${API}/match/${matchId}/comments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ device_id: getDeviceId(), text: trimmed }),
      })
      const body = await res.json()
      if (body.success) {
        setComments((c) => [body.data, ...c])
        setText('')
      } else {
        setError(body.error ?? 'Could not post comment')
      }
    } catch {
      setError('Network error — try again')
    } finally {
      setPosting(false)
    }
  }

  async function flag(id: string) {
    try {
      await fetch(`${API}/comments/${id}/flag`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ device_id: getDeviceId() }),
      })
      setComments((c) => c.filter((x) => x.id !== id))
    } catch { /* ignore */ }
  }

  if (disabled) return null

  return (
    <div className="comments">
      <form className="comment-form" onSubmit={submit}>
        <textarea
          className="comment-input"
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Share your thoughts on the match…"
          maxLength={500}
          rows={2}
        />
        <div className="comment-form-row">
          <span className="comment-count">{text.length}/500</span>
          <button className="comment-submit" type="submit" disabled={posting || text.trim().length < 2}>
            {posting ? 'Posting…' : 'Post'}
          </button>
        </div>
        {error && <p className="comment-error">{error}</p>}
      </form>

      {loading ? (
        <p className="comment-empty">Loading comments…</p>
      ) : comments.length === 0 ? (
        <p className="comment-empty">No comments yet — be the first to react.</p>
      ) : (
        <ul className="comment-list">
          {comments.map((c) => (
            <li key={c.id} className="comment-item">
              <div className="comment-head">
                <span className="comment-author">{fanLabel(c.device_id)}</span>
                <span className="comment-time">{timeAgo(c.created_at)}</span>
              </div>
              <p className="comment-text">{c.text}</p>
              <button className="comment-flag" onClick={() => flag(c.id)} aria-label="Report comment">⚑ Report</button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
