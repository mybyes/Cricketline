/** Railway production backend — public, safe to embed as fallback */
export const PRODUCTION_API_URL = 'https://backend-production-233f.up.railway.app'

/** Server-side fetches (SSR, sitemap, match pages) */
export function getApiUrl(): string {
  return (
    process.env.API_URL
    ?? process.env.NEXT_PUBLIC_API_URL
    ?? (process.env.NODE_ENV === 'development' ? 'http://localhost:3000' : PRODUCTION_API_URL)
  )
}

/** Client-side refresh — only NEXT_PUBLIC_* is inlined; fallback avoids Vercel misconfig */
export function getPublicApiUrl(): string {
  if (process.env.NEXT_PUBLIC_API_URL) return process.env.NEXT_PUBLIC_API_URL
  if (process.env.NODE_ENV === 'development') return 'http://localhost:3000'
  return PRODUCTION_API_URL
}
