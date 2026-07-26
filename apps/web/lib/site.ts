/** Canonical public site origin — used for metadata, sitemap, robots, JSON-LD. */
export function getSiteUrl() {
  const fromEnv = (process.env.NEXT_PUBLIC_SITE_URL ?? '').trim().replace(/\/$/, '')
  if (fromEnv) return fromEnv
  const vercel = (process.env.VERCEL_URL ?? '').trim().replace(/\/$/, '')
  if (vercel) return vercel.startsWith('http') ? vercel : `https://${vercel}`
  // Current Vercel preview until a custom domain is owned and set in env
  return 'https://cricketline-mybyes.vercel.app'
}
