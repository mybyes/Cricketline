import axios from 'axios'

const EXPO_PUSH_URL = 'https://exp.host/--/api/v2/push/send'

export async function sendPushNotifications(
  tokens: string[],
  title: string,
  body: string,
  data?: Record<string, string>,
) {
  if (!tokens.length) return

  const messages = tokens.map((to) => ({
    to,
    title,
    body,
    data,
    sound: 'default' as const,
  }))

  for (let i = 0; i < messages.length; i += 100) {
    await axios.post(EXPO_PUSH_URL, messages.slice(i, i + 100), {
      headers: { 'Content-Type': 'application/json' },
    })
  }
}
