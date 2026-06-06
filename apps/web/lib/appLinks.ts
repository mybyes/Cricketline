/** Set NEXT_PUBLIC_ANDROID_APP_URL on Vercel once the Play Store listing is live. */
export function getAndroidAppUrl(): string | null {
  const url = process.env.NEXT_PUBLIC_ANDROID_APP_URL?.trim()
  return url || null
}
