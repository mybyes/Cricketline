import * as Notifications from 'expo-notifications'
import { useEffect } from 'react'
import { Platform } from 'react-native'
import { openMatchFromNotification } from '../navigation/navigationRef'

function matchIdFromResponse(response: Notifications.NotificationResponse | null): string | null {
  const data = response?.notification.request.content.data
  const id = data?.matchId
  return typeof id === 'string' && id.length > 0 ? id : null
}

export function useNotificationNavigation() {
  useEffect(() => {
    if (Platform.OS === 'web') return

    Notifications.getLastNotificationResponseAsync().then((last) => {
      const matchId = matchIdFromResponse(last)
      if (matchId) openMatchFromNotification(matchId)
    })

    const sub = Notifications.addNotificationResponseReceivedListener((response) => {
      const matchId = matchIdFromResponse(response)
      if (matchId) openMatchFromNotification(matchId)
    })

    return () => sub.remove()
  }, [])
}
