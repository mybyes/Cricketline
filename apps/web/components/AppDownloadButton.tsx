import { getAndroidAppUrl } from '@/lib/appLinks'

type Props = {
  className?: string
  label?: string
  comingSoonLabel?: string
}

export function AppDownloadButton({
  className = 'store-btn',
  label = '📱 Get on Google Play',
  comingSoonLabel = '📱 Android — coming soon',
}: Props) {
  const url = getAndroidAppUrl()

  if (url) {
    return (
      <a className={className} href={url} target="_blank" rel="noopener noreferrer">
        {label}
      </a>
    )
  }

  return (
    <a className={`${className} store-btn-soon`} href="/#download">
      {comingSoonLabel}
    </a>
  )
}
