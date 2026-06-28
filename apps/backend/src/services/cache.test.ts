import test from 'node:test'
import assert from 'node:assert/strict'
import type { Redis } from 'ioredis'
import { cached } from './cache'

/** Map-backed fake Redis — only the methods cached()/its helpers touch. */
function fakeRedis() {
  const store = new Map<string, string>()
  const r = {
    store,
    get: async (k: string) => store.get(k) ?? null,
    setex: async (k: string, _ttl: number, v: string) => { store.set(k, v) },
    del: async (...ks: string[]) => { let n = 0; for (const k of ks) if (store.delete(k)) n++; return n },
  }
  return r as unknown as Redis & { store: Map<string, string> }
}

test('cached: fresh fetch is stored and returned non-stale', async () => {
  const r = fakeRedis()
  const res = await cached(r, 'k:fresh', 60, async () => [{ a: 1 }])
  assert.equal(res.stale, false)
  assert.deepEqual(res.data, [{ a: 1 }])
})

test('cached: a warm cache is served without calling the fetcher again', async () => {
  const r = fakeRedis()
  await cached(r, 'k:warm', 60, async () => [1])
  let called = false
  const res = await cached(r, 'k:warm', 60, async () => { called = true; return [2] })
  assert.equal(called, false, 'fetcher must not run on a cache hit')
  assert.deepEqual(res.data, [1])
})

test('cached: fetcher failure falls back to the 7-day real backup (stale)', async () => {
  const r = fakeRedis()
  await cached(r, 'k:bak', 60, async () => [{ score: 100 }]) // writes primary + backup
  r.store.delete('k:bak')                                     // primary TTL expires; backup remains
  const res = await cached(r, 'k:bak', 60, async () => { throw new Error('upstream down') })
  assert.equal(res.stale, true)
  assert.deepEqual(res.data, [{ score: 100 }], 'must serve the real backup, not throw')
})

test('cached: an empty result never overwrites a good backup', async () => {
  const r = fakeRedis()
  await cached(r, 'k:empty', 60, async () => [{ real: true }])
  r.store.delete('k:empty')
  const res = await cached(r, 'k:empty', 60, async () => [])
  assert.deepEqual(res.data, [{ real: true }], 'empty must not shadow the real backup')
})

test('cached: a burst of concurrent misses coalesces to ONE fetch (single-flight)', async () => {
  const r = fakeRedis()
  let calls = 0
  const fetcher = async () => { calls++; await new Promise((res) => setTimeout(res, 20)); return [{ ok: 1 }] }
  const results = await Promise.all(Array.from({ length: 25 }, () => cached(r, 'k:herd', 60, fetcher)))
  assert.equal(calls, 1, 'a concurrent burst must trigger exactly one upstream fetch')
  assert.ok(results.every((x) => (x.data as { ok: number }[])[0].ok === 1), 'all callers get the fresh data')
})

test('cached: total failure with no backup arms the backoff (documents the sharp edge)', async () => {
  const r = fakeRedis()
  await assert.rejects(() => cached(r, 'k:dead', 60, async () => { throw new Error('x') }))
  // Backoff is now armed: even a fetcher that WOULD succeed is short-circuited until it expires.
  await assert.rejects(
    () => cached(r, 'k:dead', 60, async () => [{ recovered: true }]),
    /upstream_unavailable/,
  )
})
