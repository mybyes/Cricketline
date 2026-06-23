import Link from 'next/link'
import { getSiteUrl } from '@/lib/site'

export interface Crumb { name: string; href: string }

export function Breadcrumbs({ items }: { items: Crumb[] }) {
  const site = getSiteUrl()
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((it, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      name: it.name,
      item: `${site}${it.href}`,
    })),
  }
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <nav className="crumbs" aria-label="Breadcrumb">
        {items.map((it, i) => (
          <span key={it.href} className="crumb">
            {i > 0 && <span className="crumb-sep" aria-hidden>›</span>}
            {i < items.length - 1
              ? <Link href={it.href}>{it.name}</Link>
              : <span aria-current="page">{it.name}</span>}
          </span>
        ))}
      </nav>
    </>
  )
}
