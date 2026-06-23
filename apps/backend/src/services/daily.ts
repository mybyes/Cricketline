import type { Match } from './cricapi'

export interface Offer {
  id: string
  title: string
  brand: string
  perk: string
  code: string
  category: 'fantasy' | 'tickets' | 'merch' | 'streaming'
  ctaUrl: string | null
  placeholder: boolean
}

/**
 * Placeholder daily offers — the scaffold for real partner/affiliate deals.
 * Swap `placeholder: false` + real `ctaUrl`/`code` once partnerships exist.
 */
export const OFFERS: Offer[] = [
  { id: 'fantasy-bonus', title: '100% Deposit Bonus', brand: 'Fantasy Partner', perk: 'Up to ₹500 on first deposit', code: 'CRICFAST', category: 'fantasy', ctaUrl: null, placeholder: true },
  { id: 'tickets', title: '15% off Match Tickets', brand: 'Tickets Partner', perk: 'On international fixtures', code: 'CF15', category: 'tickets', ctaUrl: null, placeholder: true },
  { id: 'jersey', title: '20% off Team Jerseys', brand: 'Official Store', perk: 'Latest season kit', code: 'FAN20', category: 'merch', ctaUrl: null, placeholder: true },
  { id: 'stream', title: '1 Month Free', brand: 'Streaming Partner', perk: 'Watch live cricket', code: 'WATCHCF', category: 'streaming', ctaUrl: null, placeholder: true },
]

/** Pick the day's marquee match: a live one if available, else the soonest upcoming. */
export function pickMatchOfTheDay(matches: Match[]): Match | null {
  const live = matches.filter((m) => m.matchStarted && !m.matchEnded)
  if (live.length) {
    // Prefer the live match furthest along (more to talk about) — most innings/score entries.
    return [...live].sort((a, b) => (b.score?.length ?? 0) - (a.score?.length ?? 0))[0]
  }
  const upcoming = matches
    .filter((m) => !m.matchStarted && !m.matchEnded)
    .sort((a, b) => new Date(a.dateTimeGMT).getTime() - new Date(b.dateTimeGMT).getTime())
  return upcoming[0] ?? null
}
