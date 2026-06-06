import { readFileSync, writeFileSync, existsSync } from 'node:fs'
import { join } from 'node:path'

const dist = join(process.cwd(), 'dist')
const siteUrl = (process.env.EXPO_PUBLIC_SITE_URL || 'https://cricketfast.vercel.app').replace(/\/$/, '')

function patch(file, transform) {
  const path = join(dist, file)
  if (!existsSync(path)) {
    console.warn(`skip ${file} — not found in dist`)
    return
  }
  writeFileSync(path, transform(readFileSync(path, 'utf8')))
  console.log(`patched ${file}`)
}

patch('index.html', (html) =>
  html
    .replaceAll('__SITE_URL__', siteUrl)
    .replace(
      '"url": "__SITE_URL__"',
      `"url": "${siteUrl}"`,
    ),
)

patch('sitemap.xml', (xml) =>
  xml.replaceAll('__SITE_URL__', siteUrl),
)

patch('robots.txt', (txt) =>
  txt.replaceAll('__SITE_URL__', siteUrl),
)

patch('manifest.json', (json) =>
  json.replaceAll('__SITE_URL__', siteUrl),
)

console.log(`SEO patched for ${siteUrl}`)
