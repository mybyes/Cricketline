import type { FastifyRequest } from 'fastify'
import { OAuth2Client } from 'google-auth-library'
import { SignJWT, jwtVerify } from 'jose'

/**
 * Google sign-in, self-contained on our backend:
 *  1. the client gets a Google ID token (a signed JWT) from Google
 *  2. it POSTs that token here; we verify it against Google's public keys
 *  3. we mint our OWN short-lived session JWT (HS256) that the app then carries
 *
 * Auth is OPTIONAL — if GOOGLE_CLIENT_ID / AUTH_JWT_SECRET aren't set the routes
 * report "not configured" and the app keeps working logged-out (demo mode).
 */

export const SESSION_COOKIE = 'cf_session'
const SESSION_TTL = '30d'

// Accept any configured client id as a valid audience (web + android + ios may differ).
const AUDIENCES = [process.env.GOOGLE_CLIENT_ID, ...(process.env.GOOGLE_CLIENT_IDS ?? '').split(',')]
  .map((s) => s?.trim())
  .filter((s): s is string => !!s)

const JWT_SECRET = process.env.AUTH_JWT_SECRET
const secretKey = JWT_SECRET ? new TextEncoder().encode(JWT_SECRET) : null

const googleClient = new OAuth2Client()

export function authConfigured(): boolean {
  return AUDIENCES.length > 0 && !!secretKey
}

export interface GoogleProfile {
  sub: string
  email?: string
  name?: string
  picture?: string
}

/** Verify a Google ID token; returns the profile or null if invalid. */
export async function verifyGoogleIdToken(idToken: string): Promise<GoogleProfile | null> {
  if (!AUDIENCES.length) return null
  try {
    const ticket = await googleClient.verifyIdToken({ idToken, audience: AUDIENCES })
    const p = ticket.getPayload()
    if (!p?.sub) return null
    // Only trust verified emails for identity display.
    return { sub: p.sub, email: p.email_verified ? p.email : undefined, name: p.name, picture: p.picture }
  } catch {
    return null
  }
}

export interface SessionUser {
  id: string
  email?: string
  name?: string
  picture?: string
}

export async function signSession(user: SessionUser): Promise<string> {
  if (!secretKey) throw new Error('AUTH_JWT_SECRET not set')
  return new SignJWT({ email: user.email, name: user.name, picture: user.picture })
    .setProtectedHeader({ alg: 'HS256' })
    .setSubject(user.id)
    .setIssuedAt()
    .setExpirationTime(SESSION_TTL)
    .sign(secretKey)
}

export async function verifySession(token: string): Promise<SessionUser | null> {
  if (!secretKey) return null
  try {
    const { payload } = await jwtVerify(token, secretKey)
    if (!payload.sub) return null
    return { id: payload.sub, email: payload.email as string, name: payload.name as string, picture: payload.picture as string }
  } catch {
    return null
  }
}

/** Pull the session user off a request — cookie (web) or Bearer header (mobile). */
export async function userFromRequest(req: FastifyRequest): Promise<SessionUser | null> {
  const cookieToken = (req as FastifyRequest & { cookies?: Record<string, string> }).cookies?.[SESSION_COOKIE]
  const auth = req.headers.authorization
  const bearer = auth?.startsWith('Bearer ') ? auth.slice(7) : undefined
  const token = cookieToken || bearer
  if (!token) return null
  return verifySession(token)
}
