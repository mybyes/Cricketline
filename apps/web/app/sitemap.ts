import type { MetadataRoute } from 'next'

const site = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://cricketfastliveline.in'

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    {
      url: site,
      lastModified: new Date(),
      changeFrequency: 'always',
      priority: 1,
    },
  ]
}
