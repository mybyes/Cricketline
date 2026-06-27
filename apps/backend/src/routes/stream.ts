import { FastifyInstance } from 'fastify'
import { getLiveMatches } from '../services/cricapi'
import { cached, CACHE_KEYS, LIVE_MATCHES_TTL } from '../services/cache'
import { addClient, removeClient } from '../services/realtime'

/**
 * Server-Sent Events stream. One held-open HTTP connection per client; the server pushes
 * `event: scores` messages as they arrive (no polling). EventSource on the client auto-reconnects.
 * We hijack the reply so Fastify doesn't try to send its own response.
 */
export default async function streamRoute(app: FastifyInstance) {
  app.get('/stream', (req, reply) => {
    reply.hijack()
    reply.raw.writeHead(200, {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      Connection: 'keep-alive',
      'X-Accel-Buffering': 'no', // disable proxy buffering so events flush immediately
      'Access-Control-Allow-Origin': '*',
    })
    reply.raw.write('retry: 5000\n\n') // tell EventSource to retry after 5s if dropped

    // Send an immediate snapshot so a fresh subscriber isn't blank until the next tick.
    // Read through the cache (shared key) so EventSource reconnect storms can't burn the
    // CricAPI quota — upstream is hit at most once per LIVE_MATCHES_TTL regardless of churn.
    cached(app.redis, CACHE_KEYS.liveMatches(), LIVE_MATCHES_TTL, () => getLiveMatches(app.redis))
      .then(({ data }) => reply.raw.write(`event: scores\ndata: ${JSON.stringify({ data, ts: Date.now(), snapshot: true })}\n\n`))
      .catch(() => {})

    addClient(reply)

    // Heartbeat comment keeps intermediaries from closing an idle connection.
    const ping = setInterval(() => {
      try { reply.raw.write(': ping\n\n') } catch { /* closed */ }
    }, 25_000)

    req.raw.on('close', () => {
      clearInterval(ping)
      removeClient(reply)
    })
  })
}
