import type { MetadataRoute } from 'next'
import { BRAND_DESCRIPTION, BRAND_NAME, BRAND_TAGLINE } from '@/lib/brand'

/** Site manifest for icons / theme — product app is Android (Play Store). */
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: `${BRAND_NAME} — ${BRAND_TAGLINE}`,
    short_name: BRAND_NAME,
    description: BRAND_DESCRIPTION,
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
