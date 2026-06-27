import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import AsyncStorage from '@react-native-async-storage/async-storage'
import * as Google from 'expo-auth-session/providers/google'
import * as WebBrowser from 'expo-web-browser'
import { getApiUrl } from '../lib/api'

// Required so the auth popup can hand control back to the app.
WebBrowser.maybeCompleteAuthSession()

const API = getApiUrl()
const TOKEN_KEY = 'cf_auth_token'

const WEB_CLIENT_ID = process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID
const ANDROID_CLIENT_ID = process.env.EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID
const IOS_CLIENT_ID = process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID
const HAS_CLIENT = !!(WEB_CLIENT_ID || ANDROID_CLIENT_ID || IOS_CLIENT_ID)

export interface AuthUser {
  id: string
  email?: string
  name?: string
  picture?: string
}

interface AuthContextValue {
  user: AuthUser | null
  token: string | null
  ready: boolean
  /** auth is wired on the server AND a Google client id is configured in this build */
  enabled: boolean
  signIn: () => Promise<void>
  signOut: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null)
  const [token, setToken] = useState<string | null>(null)
  const [ready, setReady] = useState(false)
  const [serverEnabled, setServerEnabled] = useState(false)

  const [request, response, promptAsync] = Google.useAuthRequest({
    webClientId: WEB_CLIENT_ID,
    androidClientId: ANDROID_CLIENT_ID,
    iosClientId: IOS_CLIENT_ID,
    scopes: ['openid', 'profile', 'email'],
  })

  const enabled = serverEnabled && HAS_CLIENT && !!request

  // Send the Google id token to our backend, store the returned session token.
  const exchange = useCallback(async (idToken: string) => {
    try {
      const res = await fetch(`${API}/auth/google`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ idToken }),
      })
      const body = await res.json().catch(() => null)
      if (body?.success && body.token) {
        await AsyncStorage.setItem(TOKEN_KEY, body.token)
        setToken(body.token)
        setUser(body.user as AuthUser)
      }
    } catch {
      /* stay signed-out */
    }
  }, [])

  // Boot: restore a saved session + read server auth config.
  useEffect(() => {
    let cancelled = false
    ;(async () => {
      try {
        const saved = await AsyncStorage.getItem(TOKEN_KEY)
        const [cfg, me] = await Promise.all([
          fetch(`${API}/auth/config`).then((r) => r.json()).catch(() => ({ enabled: false })),
          saved
            ? fetch(`${API}/auth/me`, { headers: { Authorization: `Bearer ${saved}` } })
                .then((r) => (r.ok ? r.json() : null)).catch(() => null)
            : Promise.resolve(null),
        ])
        if (cancelled) return
        setServerEnabled(!!cfg?.enabled)
        if (saved && me?.user) { setToken(saved); setUser(me.user as AuthUser) }
        else if (saved) { await AsyncStorage.removeItem(TOKEN_KEY) } // stale/expired
      } finally {
        if (!cancelled) setReady(true)
      }
    })()
    return () => { cancelled = true }
  }, [])

  // Handle the Google auth result.
  useEffect(() => {
    if (response?.type !== 'success') return
    const idToken = response.params?.id_token ?? response.authentication?.idToken
    if (idToken) void exchange(idToken)
  }, [response, exchange])

  const signIn = useCallback(async () => {
    if (!request) return
    await promptAsync()
  }, [request, promptAsync])

  const signOut = useCallback(async () => {
    await AsyncStorage.removeItem(TOKEN_KEY)
    setToken(null)
    setUser(null)
  }, [])

  const value = useMemo(
    () => ({ user, token, ready, enabled, signIn, signOut }),
    [user, token, ready, enabled, signIn, signOut],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
