import type { MetadataRoute } from 'next'

/** PWA manifest — installable web app (a positive mobile/SEO signal). */
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'LiveLine Guru — Live Cricket Line',
    short_name: 'LiveLine Guru',
    description: 'Fast live cricket line: ball-by-ball scores, session & rates, scorecards and fixtures. Free, no login.',
    start_url: '/',
    display: 'standalone',
    background_color: '#0a3f27',
    theme_color: '#0a3f27',
    categories: ['sports', 'news'],
    icons: [
      { src: '/icon.svg', sizes: 'any', type: 'image/svg+xml', purpose: 'any' },
      { src: '/icon.svg', sizes: 'any', type: 'image/svg+xml', purpose: 'maskable' },
    ],
  }
}
