import type { MetadataRoute } from 'next'

/** Site manifest for icons / theme — product app is Android (Play Store). */
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Cricket Pulse – Live Line & AI',
    short_name: 'Cricket Pulse',
    description: 'Live Line & AI — scores, display-only markets, scorecards and fixtures.',
    start_url: '/',
    display: 'standalone',
    background_color: '#F2EFE6',
    theme_color: '#163528',
    categories: ['sports', 'news'],
    icons: [
      { src: '/icon.svg', sizes: 'any', type: 'image/svg+xml', purpose: 'any' },
      { src: '/icon.svg', sizes: 'any', type: 'image/svg+xml', purpose: 'maskable' },
    ],
  }
}
