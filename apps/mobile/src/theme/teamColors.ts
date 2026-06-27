/** Real team brand colours (white-text-safe), so the UI takes its colour from the teams. */
const BRAND: Record<string, string> = {
  // IPL franchises
  RCB: '#c8102e', MI: '#045093', CSK: '#b8860b', KKR: '#3b1e5f', GT: '#16243f',
  RR: '#cf2682', DC: '#17449b', PBKS: '#b21e35', SRH: '#e2711d', LSG: '#1f6fb2',
  // International
  IND: '#0a3d91', AUS: '#15803d', ENG: '#1d2d5c', SA: '#007a4d', RSA: '#007a4d',
  NZ: '#262b33', PAK: '#0c7a3d', SL: '#1b3c8f', BAN: '#0a6b4f', WI: '#8a1538',
  AFG: '#0066b3', IRE: '#169b62', ZIM: '#b8232f', NED: '#e2711d',
}

// Keep this identical to apps/web/lib/teamColors.ts so an unbranded team hashes to the
// same colour on web and mobile.
const FALLBACK = ['#0f6b40', '#1565c0', '#6a1b9a', '#c62828', '#ef6c00', '#00838f', '#4527a0']

/** Brand colour for a team by short code (preferred) or name; deterministic hash fallback otherwise. */
export function teamColor(shortname?: string, name?: string): string {
  const key = (shortname ?? '').toUpperCase().trim()
  if (BRAND[key]) return BRAND[key]
  const derived = (name ?? '').split(' ').map((w) => w[0]).join('').slice(0, 3).toUpperCase()
  if (BRAND[derived]) return BRAND[derived]
  const seed = shortname ?? name ?? '?'
  let h = 0
  for (let i = 0; i < seed.length; i++) h = seed.charCodeAt(i) + ((h << 5) - h)
  return FALLBACK[Math.abs(h) % FALLBACK.length]
}
