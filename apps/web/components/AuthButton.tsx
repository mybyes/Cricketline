'use client'

import { useEffect, useRef, useState } from 'react'
import { useAuth } from '@/lib/auth'

/** Header sign-in control: Google button when signed-out, an account menu when signed-in. */
export function AuthButton() {
  const { user, ready, enabled, renderButton, signOut } = useAuth()
  const btnHost = useRef<HTMLDivElement>(null)
  const [open, setOpen] = useState(false)

  // Mount Google's official button into the host once we're signed-out and ready.
  useEffect(() => {
    if (ready && enabled && !user && btnHost.current) renderButton(btnHost.current)
  }, [ready, enabled, user, renderButton])

  // Close the menu on outside click.
  useEffect(() => {
    if (!open) return
    const close = () => setOpen(false)
    window.addEventListener('click', close)
    return () => window.removeEventListener('click', close)
  }, [open])

  // Auth not configured → render nothing (app stays logged-out, no broken UI).
  if (!ready || !enabled) return null

  if (!user) {
    return <div className="auth-gsi" ref={btnHost} aria-label="Sign in with Google" />
  }

  const initials = (user.name ?? user.email ?? '?').trim().slice(0, 1).toUpperCase()

  return (
    <div className="auth-menu" onClick={(e) => e.stopPropagation()}>
      <button className="auth-avatar" onClick={() => setOpen((o) => !o)} aria-haspopup="menu" aria-expanded={open}>
        {user.picture
          ? <img src={user.picture} alt="" width={30} height={30} referrerPolicy="no-referrer" />
          : <span className="auth-avatar-fallback">{initials}</span>}
      </button>
      {open && (
        <div className="auth-dropdown" role="menu">
          <div className="auth-id">
            <p className="auth-name">{user.name ?? 'Signed in'}</p>
            {user.email && <p className="auth-email">{user.email}</p>}
          </div>
          <p className="auth-note">Match alerts are available in the CricketFast app.</p>
          <button className="auth-signout" onClick={() => { setOpen(false); void signOut() }} role="menuitem">
            Sign out
          </button>
        </div>
      )}
    </div>
  )
}
