import test from 'node:test'
import assert from 'node:assert/strict'
import type { FastifyRequest } from 'fastify'

// Auth reads these at module load, so set them BEFORE requiring it. require() runs in
// statement order (unlike a hoisted import), so the env is in place first.
process.env.AUTH_JWT_SECRET = 'test-secret-please-change-0123456789'
process.env.GOOGLE_CLIENT_ID = 'test-client.apps.googleusercontent.com'

const { authConfigured, signSession, verifySession, userFromRequest, SESSION_COOKIE } =
  require('./auth') as typeof import('./auth')

const asReq = (r: Partial<FastifyRequest> & { cookies?: Record<string, string> }) =>
  ({ headers: {}, ...r } as unknown as FastifyRequest)

test('authConfigured is true when client id + secret are present', () => {
  assert.equal(authConfigured(), true)
})

test('session sign → verify round-trips the user claims', async () => {
  const token = await signSession({ id: 'u_1', email: 'a@b.com', name: 'Aman', picture: 'p.png' })
  const u = await verifySession(token)
  assert.equal(u?.id, 'u_1')
  assert.equal(u?.email, 'a@b.com')
  assert.equal(u?.name, 'Aman')
})

test('verifySession rejects garbage and tampered tokens', async () => {
  assert.equal(await verifySession('not.a.jwt'), null)
  const token = await signSession({ id: 'u_2' })
  assert.equal(await verifySession(`${token}x`), null, 'a flipped byte must fail signature')
})

test('userFromRequest reads the cookie, then the Bearer header, else null', async () => {
  const token = await signSession({ id: 'u_3' })
  assert.equal((await userFromRequest(asReq({ cookies: { [SESSION_COOKIE]: token } })))?.id, 'u_3')
  assert.equal((await userFromRequest(asReq({ headers: { authorization: `Bearer ${token}` } })))?.id, 'u_3')
  assert.equal(await userFromRequest(asReq({})), null)
})
