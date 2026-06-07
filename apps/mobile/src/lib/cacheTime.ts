export function formatCachedAt(ts?: number): string | null {
  if (!ts) return null
  const sec = Math.max(0, Math.floor((Date.now() - ts) / 1000))
  if (sec < 60) return 'Updated just now'
  const mins = Math.floor(sec / 60)
  if (mins < 60) return `Last updated ${mins}m ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `Last updated ${hrs}h ago`
  return `Last updated ${Math.floor(hrs / 24)}d ago`
}

export function staleNotice(cachedAt?: number): string {
  return formatCachedAt(cachedAt) ?? 'Showing saved scores'
}

/** Never show upstream provider errors to users */
export function isInternalError(msg?: string): boolean {
  if (!msg) return false
  const l = msg.toLowerCase()
  return l.includes('block') || l.includes('cricapi') || l.includes('rate') || l.includes('upstream')
}
