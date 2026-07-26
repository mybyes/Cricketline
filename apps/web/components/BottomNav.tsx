'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

const TABS = [
  {
    href: '/',
    label: 'Home',
    icon: 'home' as const,
    match: (p: string) => p === '/' || p.startsWith('/live') || p.startsWith('/match/'),
  },
  {
    href: '/matches',
    label: 'Matches',
    icon: 'matches' as const,
    match: (p: string) => p.startsWith('/matches') || p.startsWith('/fixtures') || p.startsWith('/results'),
  },
  {
    href: '/series',
    label: 'Series',
    icon: 'series' as const,
    match: (p: string) => p.startsWith('/series'),
  },
  {
    href: '/more',
    label: 'More',
    icon: 'more' as const,
    match: (p: string) =>
      p.startsWith('/more') || p.startsWith('/about') || p.startsWith('/privacy') || p.startsWith('/terms')
      || p.startsWith('/rankings') || p.startsWith('/teams') || p.startsWith('/search'),
  },
]

function Icon({ name, active }: { name: 'home' | 'matches' | 'series' | 'more'; active: boolean }) {
  const stroke = active ? 'var(--ink)' : 'var(--faint)'
  if (name === 'home') {
    return (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden>
        <path d="M4 10.5 12 4l8 6.5V20a1 1 0 0 1-1 1h-5v-6H10v6H5a1 1 0 0 1-1-1v-9.5Z" stroke={stroke} strokeWidth="1.8" strokeLinejoin="round" />
      </svg>
    )
  }
  if (name === 'matches') {
    return (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden>
        <rect x="3.5" y="5" width="17" height="15" rx="2" stroke={stroke} strokeWidth="1.8" />
        <path d="M8 3.5v3M16 3.5v3M3.5 10h17" stroke={stroke} strokeWidth="1.8" strokeLinecap="round" />
      </svg>
    )
  }
  if (name === 'series') {
    return (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden>
        <path d="M8 21h8M12 17v4M7 4h10v4a5 5 0 0 1-10 0V4Z" stroke={stroke} strokeWidth="1.8" strokeLinejoin="round" />
        <path d="M7 6H5a2 2 0 0 0 0 4h2M17 6h2a2 2 0 0 1 0 4h-2" stroke={stroke} strokeWidth="1.8" strokeLinecap="round" />
      </svg>
    )
  }
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden>
      <circle cx="6" cy="12" r="1.6" fill={stroke} />
      <circle cx="12" cy="12" r="1.6" fill={stroke} />
      <circle cx="18" cy="12" r="1.6" fill={stroke} />
    </svg>
  )
}

/** App-style bottom tabs: Home · Matches · Series · More */
export function BottomNav() {
  const pathname = usePathname() || '/'

  return (
    <nav className="bottom-nav" aria-label="Primary">
      {TABS.map((t) => {
        const active = t.match(pathname)
        return (
          <Link
            key={t.href}
            href={t.href}
            className={`bottom-nav-item${active ? ' bottom-nav-on' : ''}`}
            aria-current={active ? 'page' : undefined}
          >
            {active ? <span className="bottom-nav-bar" aria-hidden /> : null}
            <Icon name={t.icon} active={active} />
            <span>{t.label}</span>
          </Link>
        )
      })}
    </nav>
  )
}
