import { FastifyInstance } from 'fastify'
import {
  authConfigured, SESSION_COOKIE, signSession, userFromRequest, verifyGoogleIdToken,
} from '../lib/auth'
import { getUser, upsertUserByGoogle } from '../services/users'

const THIRTY_DAYS = 60 * 60 * 24 * 30

export default async function authRoute(app: FastifyInstance) {
  // Tells the clients whether to show the Google button at all.
  app.get('/auth/config', async () => ({ success: true, enabled: authConfigured() }))

  // Exchange a Google ID token for our session. Sets an httpOnly cookie (web) and
  // also returns the token in the body (mobile stores it and sends it as a Bearer).
  app.post<{ Body: { idToken?: string } }>('/auth/google', async (req, reply) => {
    if (!authConfigured()) {
      return reply.status(503).send({ success: false, error: 'Sign-in is not configured on this server' })
    }
    const idToken = req.body?.idToken
    if (!idToken) return reply.status(400).send({ success: false, error: 'idToken required' })

    const profile = await verifyGoogleIdToken(idToken)
    if (!profile) return reply.status(401).send({ success: false, error: 'Invalid Google token' })

    const user = await upsertUserByGoogle(profile)
    const token = await signSession(user)

    // In prod the web app and API are on different sites (Vercel ↔ Railway), so the
    // cookie must be SameSite=None; Secure to be sent cross-site. Locally (same-site
    // localhost) Lax is fine and works over http.
    const prod = process.env.NODE_ENV === 'production'
    reply.setCookie(SESSION_COOKIE, token, {
      httpOnly: true,
      secure: prod,
      sameSite: prod ? 'none' : 'lax',
      path: '/',
      maxAge: THIRTY_DAYS,
    })
    return { success: true, token, user }
  })

  app.get('/auth/me', async (req, reply) => {
    const session = await userFromRequest(req)
    if (!session) return reply.status(401).send({ success: false, error: 'Not signed in' })
    // Re-read from storage so name/picture stay fresh; fall back to the token claims.
    const user = (await getUser(session.id)) ?? session
    return { success: true, user }
  })

  app.post('/auth/logout', async (_req, reply) => {
    reply.clearCookie(SESSION_COOKIE, { path: '/' })
    return { success: true }
  })
}
