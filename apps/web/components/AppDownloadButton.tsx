import { getAndroidAppUrl } from '@/lib/appLinks'

type Props = {
  className?: string
  label?: string
}

/** Real Play Store link only — no “coming soon” placeholders. */
export function AppDownloadButton({
  className = 'store-btn',
  label = 'Get on Google Play',
}: Props) {
  const url = getAndroidAppUrl()
  if (!url) return null

  return (
    <a className={className} href={url} target="_blank" rel="noopener noreferrer">
      {label}
    </a>
  )
}
