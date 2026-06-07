import type { FastifyBaseLogger } from 'fastify'
import type { Redis } from 'ioredis'
import { CACHE_KEYS, readCache } from './cache'
import { getAllMatchesCached } from './cricapi'

/** Populate Redis backups on boot so first user never sees a blank feed after a block. */
export async function warmCaches(redis: Redis, log: FastifyBaseLogger) {
  const inBackoff = await redis.get('meta:cricapi:backoff')
  if (inBackoff) {
    log.info('cache warm: skipped — upstream in cooldown')
    return
  }
  try {
    const all = await getAllMatchesCached(redis)
    log.info({ count: all.length }, 'cache warm: all matches')
  } catch (e) {
    const hit = await readCache<unknown[]>(redis, CACHE_KEYS.allMatches())
    if (hit) {
      log.info({ count: hit.data.length, cachedAt: hit.cachedAt }, 'cache warm: using all-matches backup')
    } else {
      log.warn({ err: e }, 'cache warm: no live API and no backup yet')
    }
  }
}
