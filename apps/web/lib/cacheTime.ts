/** Kept for optional debug; never surface age-of-cache to users (misleading vs live feed). */
export function formatCachedAt(_ts?: number): string | null {
  return null
}

/** Stale banners disabled — live stream / polling is the source of truth. */
export function staleNotice(_cachedAt?: number): string | null {
  return null
}
