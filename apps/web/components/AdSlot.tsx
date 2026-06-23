/**
 * Ad slot. Currently serves a house ad for @ChaiPeCric on X across all placements.
 * To switch to a network (AdSense etc.), swap the inner markup — `data-ad-slot` keeps
 * each placement identifiable.
 */
const AD_URL = 'https://x.com/ChaiPeCric'

function XLogo({ size = 22 }: { size?: number }) {
  return (
    <svg viewBox="0 0 24 24" width={size} height={size} aria-hidden fill="currentColor">
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
    </svg>
  )
}

export function AdSlot({ id, format = 'leaderboard' }: { id: string; format?: 'leaderboard' | 'rectangle' | 'sidebar' }) {
  return (
    <a
      className={`ad-slot ad-${format}`}
      data-ad-slot={id}
      href={AD_URL}
      target="_blank"
      rel="sponsored noopener noreferrer"
    >
      <span className="ad-label">Advertisement</span>
      <span className="ad-x"><XLogo size={format === 'leaderboard' ? 22 : 30} /></span>
      <span className="ad-body">
        <span className="ad-handle">@ChaiPeCric</span>
        <span className="ad-tag">Cricket banter, served hot — follow on X</span>
      </span>
      <span className="ad-cta">Follow</span>
    </a>
  )
}
