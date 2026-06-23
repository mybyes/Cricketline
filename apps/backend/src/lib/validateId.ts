import type { FastifyRequest, FastifyReply } from 'fastify'

/** Match/series IDs are CricAPI UUIDs or our seed slugs — alphanumeric, dashes, underscores. */
const ID_RE = /^[a-zA-Z0-9_-]{1,64}$/

export function isValidId(id: unknown): id is string {
  return typeof id === 'string' && ID_RE.test(id)
}

/**
 * preHandler that rejects malformed :id / :matchId params before they reach a
 * route handler — prevents Redis-key injection and wasted upstream calls.
 */
export async function validateIdParam(req: FastifyRequest, reply: FastifyReply) {
  const params = req.params as Record<string, string | undefined>
  const id = params.id ?? params.matchId
  if (!isValidId(id)) {
    reply.status(400).send({ success: false, error: 'Invalid match id' })
  }
}
