export const PRODUCTION_API_URL = 'https://cricketline.onrender.com'

export function getApiUrl(): string {
  if (process.env.EXPO_PUBLIC_API_URL) return process.env.EXPO_PUBLIC_API_URL
  if (__DEV__) return 'http://localhost:3000'
  return PRODUCTION_API_URL
}
