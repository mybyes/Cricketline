import type { Redis } from 'ioredis'
import type { FastifyReply } from 'fastify'

/**
 * Real-time fan-out: Redis pub-sub (the "event bus") → connected SSE clients (the "push" layer).
 *
 * Why Redis pub-sub if we could just keep an in-memory client list? Because in a multi-instance
 * deploy, a score update handled by instance A must reach clients connected to instance B.
 * Every instance subscribes to the same channel, so a publish on any instance fans out to ALL
 * clients across ALL instances. That's the scaling lesson.
 */
const CHANNEL = 'rt:scores'

let publisher: Redis | null = null
let subscriber: Redis | null = null
const clients = new Set<FastifyReply>()

export function initRealtime(redis: Redis) {
  publisher = redis
  // A connection in subscriber mode can't run normal commands — use a dedicated duplicate.
  subscriber = redis.duplicate()
  subscriber.subscribe(CHANNEL).catch(() => {})
  subscriber.on('message', (_channel, message) => {
    // Fan out the event to every locally-connected SSE client.
    for (const reply of clients) {
      try {
        reply.raw.write(`event: scores\ndata: ${message}\n\n`)
      } catch {
        clients.delete(reply)
      }
    }
  })
}

/** Publish a score event to the bus — fans out to clients on every instance. */
export function publishScores(payload: unknown) {
  publisher?.publish(CHANNEL, JSON.stringify(payload)).catch(() => {})
}

export function addClient(reply: FastifyReply) { clients.add(reply) }
export function removeClient(reply: FastifyReply) { clients.delete(reply) }
export function clientCount() { return clients.size }
