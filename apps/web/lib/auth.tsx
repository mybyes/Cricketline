'use client'

import { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react'
import { getPublicApiUrl } from './apiUrl'

const API = getPublicApiUrl()
const CLIENT_ID = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID

export interface AuthUser {
  id: string
  email?: string
  name?: string
  picture?: string
}

interface AuthContextValue {
  user: AuthUser | null
  ready: boolean
  /** auth is wired on the server AND a Google client id is configured here */
  enabled: boolean
  /** render Google's official button into a container element */
  renderButton: (el: HTMLElement) => void
  /** trigger Google One Tap / popup */
  prompt: () => void
  signOut: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue | null>(null)

// Minimal shape of the Google Identity Services we use.
interface GoogleId {
  accounts: {
    id: {
      initialize: (cfg: { client_id: string; callback: (r: { credential: string }) => void; auto_select?: boolean }) => void
      renderButton: (el: HTMLElement, opts: Record<string, unknown>) => void
      prompt: () => void
      disableAutoSelect: () => void
    }
  }
}
declare global {
  interface Window { google?: GoogleId }
}

const GSI_SRC = 'https://accounts.google.com/gsi/client'

function loadGsi(): Promise<void> {
  return new Promise((resolve, reject) => {
    if (typeof window === 'undefined') return reject(new Error('no window'))
    if (window.google?.accounts?.id) return resolve()
    const existing = document.querySelector<HTMLScriptElement>(`script[src="${GSI_SRC}"]`)
    if (existing) {
      existing.addEventListener('load', () => resolve())
      existing.addEventListener('error', () => reject(new Error('gsi failed')))
      return
    }
    const s = document.createElement('script')
    s.src = GSI_SRC
    s.async = true
    s.defer = true
    s.onload = () => resolve()
    s.onerror = () => reject(new Error('gsi failed'))
    document.head.appendChild(s)
  })
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null)
  const [ready, setReady] = useState(false)
  const [serverEnabled, setServerEnabled] = useState(false)
  const initialized = useRef(false)

  const enabled = serverEnabled && !!CLIENT_ID

  // Exchange the Google credential for our session, then load the profile.
  const handleCredential = useCallback(async (credential: string) => {
    try {
      const res = await fetch(`${API}/auth/google`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ idToken: credential }),
      })
      const body = await res.json().catch(() => null)
      if (body?.success && body.user) setUser(body.user as AuthUser)
    } catch {
      /* swallow — UI just stays signed-out */
    }
  }, [])

  // Boot: check server config + existing session, then wire up Google.
  useEffect(() => {
    let cancelled = false
    ;(async () => {
      try {
        const [cfgRes, meRes] = await Promise.all([
          fetch(`${API}/auth/config`).then((r) => r.json()).catch(() => ({ enabled: false })),
          fetch(`${API}/auth/me`, { credentials: 'include' }).then((r) => (r.ok ? r.json() : null)).catch(() => null),
        ])
        if (cancelled) return
        setServerEnabled(!!cfgRes?.enabled)
        if (meRes?.user) setUser(meRes.user as AuthUser)

        if (cfgRes?.enabled && CLIENT_ID) {
          await loadGsi()
          if (cancelled) return
          if (!initialized.current && window.google?.accounts?.id) {
            window.google.accounts.id.initialize({
              client_id: CLIENT_ID,
              callback: (r) => handleCredential(r.credential),
            })
            initialized.current = true
          }
        }
      } finally {
        if (!cancelled) setReady(true)
      }
    })()
    return () => { cancelled = true }
  }, [handleCredential])

  const renderButton = useCallback((el: HTMLElement) => {
    if (!initialized.current || !window.google?.accounts?.id) return
    el.innerHTML = ''
    window.google.accounts.id.renderButton(el, { type: 'standard', theme: 'outline', size: 'medium', shape: 'pill', text: 'signin' })
  }, [])

  const prompt = useCallback(() => {
    window.google?.accounts?.id.prompt()
  }, [])

  const signOut = useCallback(async () => {
    try { await fetch(`${API}/auth/logout`, { method: 'POST', credentials: 'include' }) } catch { /* ignore */ }
    window.google?.accounts?.id.disableAutoSelect()
    setUser(null)
  }, [])

  return (
    <AuthContext.Provider value={{ user, ready, enabled, renderButton, prompt, signOut }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
