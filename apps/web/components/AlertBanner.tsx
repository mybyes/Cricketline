export function AlertBanner({ message, stale }: { message?: string; stale?: boolean }) {
  if (!message && !stale) return null
  return (
    <div className={`alert-banner ${stale ? 'alert-stale' : 'alert-error'}`}>
      {stale
        ? '⏳ Showing cached scores — live API rate limited. Data may be a few minutes old.'
        : `⚠ ${message ?? 'Unable to reach score API. Set API_URL on Vercel to your Railway backend.'}`}
    </div>
  )
}
