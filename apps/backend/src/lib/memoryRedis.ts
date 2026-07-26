import { EventEmitter } from 'node:events'

/**
 * Minimal in-process Redis stand-in for local seed/demo when Docker Redis
 * isn't available. Not for production — no persistence, single process only.
 *
 * Enable with: UPSTASH_REDIS_URL=memory://
 */

type Entry = { value: string; expiresAt?: number }

export class MemoryRedis {
  private store = new Map<string, Entry>()
  private sets = new Map<string, Set<string>>()
  private hashes = new Map<string, Map<string, string>>()
  private hashExpires = new Map<string, number>()
  private bus = new EventEmitter()
  private channels = new Set<string>()
  status: 'ready' | 'end' = 'ready'

  private hashAlive(key: string): boolean {
    const exp = this.hashExpires.get(key)
    if (exp != null && Date.now() >= exp) {
      this.hashes.delete(key)
      this.hashExpires.delete(key)
      return false
    }
    return this.hashes.has(key)
  }

  private getEntry(key: string): Entry | undefined {
    const e = this.store.get(key)
    if (!e) return undefined
    if (e.expiresAt != null && Date.now() >= e.expiresAt) {
      this.store.delete(key)
      return undefined
    }
    return e
  }

  async get(key: string): Promise<string | null> {
    return this.getEntry(key)?.value ?? null
  }

  async set(
    key: string,
    value: string,
    ...args: Array<string | number>
  ): Promise<'OK' | null> {
    // Supports: set(k,v) | set(k,v,'EX',sec) | set(k,v,'EX',sec,'NX')
    let ex: number | undefined
    let nx = false
    for (let i = 0; i < args.length; i++) {
      const a = String(args[i]).toUpperCase()
      if (a === 'EX') {
        ex = Number(args[++i])
      } else if (a === 'NX') {
        nx = true
      }
    }
    if (nx && this.getEntry(key)) return null
    this.store.set(key, {
      value: String(value),
      expiresAt: ex != null ? Date.now() + ex * 1000 : undefined,
    })
    return 'OK'
  }

  async setex(key: string, seconds: number, value: string): Promise<'OK'> {
    await this.set(key, value, 'EX', seconds)
    return 'OK'
  }

  async del(...keys: string[]): Promise<number> {
    let n = 0
    for (const k of keys) {
      if (this.store.delete(k)) n++
      if (this.sets.delete(k)) n++
      if (this.hashes.delete(k)) n++
    }
    return n
  }

  async hset(key: string, field: string, value: string): Promise<number> {
    this.hashAlive(key)
    let h = this.hashes.get(key)
    if (!h) {
      h = new Map()
      this.hashes.set(key, h)
    }
    const isNew = !h.has(field)
    h.set(field, String(value))
    return isNew ? 1 : 0
  }

  async hgetall(key: string): Promise<Record<string, string>> {
    if (!this.hashAlive(key)) return {}
    const h = this.hashes.get(key)
    if (!h) return {}
    return Object.fromEntries(h.entries())
  }

  async incr(key: string): Promise<number> {
    const cur = Number((await this.get(key)) ?? '0') + 1
    const prev = this.getEntry(key)
    this.store.set(key, { value: String(cur), expiresAt: prev?.expiresAt })
    return cur
  }

  async expire(key: string, seconds: number): Promise<number> {
    const e = this.getEntry(key)
    if (e) {
      e.expiresAt = Date.now() + seconds * 1000
      this.store.set(key, e)
      return 1
    }
    if (this.hashAlive(key)) {
      this.hashExpires.set(key, Date.now() + seconds * 1000)
      return 1
    }
    return 0
  }

  async sadd(key: string, ...members: string[]): Promise<number> {
    let set = this.sets.get(key)
    if (!set) {
      set = new Set()
      this.sets.set(key, set)
    }
    let added = 0
    for (const m of members) {
      if (!set.has(m)) {
        set.add(m)
        added++
      }
    }
    return added
  }

  async srem(key: string, ...members: string[]): Promise<number> {
    const set = this.sets.get(key)
    if (!set) return 0
    let n = 0
    for (const m of members) {
      if (set.delete(m)) n++
    }
    return n
  }

  async smembers(key: string): Promise<string[]> {
    return [...(this.sets.get(key) ?? [])]
  }

  async keys(pattern: string): Promise<string[]> {
    const re = new RegExp('^' + pattern.replace(/\*/g, '.*').replace(/\?/g, '.') + '$')
    const out: string[] = []
    for (const k of this.store.keys()) {
      if (this.getEntry(k) && re.test(k)) out.push(k)
    }
    for (const k of this.sets.keys()) {
      if (re.test(k) && !out.includes(k)) out.push(k)
    }
    return out
  }

  async publish(channel: string, message: string): Promise<number> {
    this.bus.emit('message', channel, message)
    return 1
  }

  async subscribe(...channels: string[]): Promise<number> {
    for (const c of channels) this.channels.add(c)
    return channels.length
  }

  on(event: string, listener: (...args: unknown[]) => void): this {
    if (event === 'message') {
      this.bus.on('message', (channel: string, message: string) => {
        if (this.channels.size === 0 || this.channels.has(channel)) {
          listener(channel, message)
        }
      })
    }
    return this
  }

  duplicate(): MemoryRedis {
    // Share the same store + bus so pub/sub works across publisher/subscriber
    // like Redis does within one process when using duplicate().
    const clone = new MemoryRedis()
    clone.store = this.store
    clone.sets = this.sets
    clone.hashes = this.hashes
    clone.hashExpires = this.hashExpires
    clone.bus = this.bus
    return clone
  }

  async quit(): Promise<'OK'> {
    this.status = 'end'
    return 'OK'
  }

  async ping(): Promise<'PONG'> {
    return 'PONG'
  }
}

export function isMemoryRedisUrl(url: string): boolean {
  return url === 'memory://' || url.startsWith('memory://')
}
