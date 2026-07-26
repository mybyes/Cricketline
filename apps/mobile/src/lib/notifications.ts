import * as Notifications from 'expo-notifications'
import { Platform } from 'react-native'
import { registerDevice } from './api'
import { getDeviceId } from './device'

/** Push is disabled for the lightweight info-app build. Keep the helper for a future toggle. */
export const PUSH_ENABLED = false

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: PUSH_ENABLED,
    shouldShowList: PUSH_ENABLED,
    shouldPlaySound: PUSH_ENABLED,
    shouldSetBadge: false,
  }),
})

export async function registerForPushNotifications(_authToken?: string | null): Promise<string | null> {
  // No permission prompts / device registration while push is off.
  if (!PUSH_ENABLED) return null
  if (Platform.OS === 'web') return null

  const { status: existing } = await Notifications.getPermissionsAsync()
  let finalStatus = existing
  if (existing !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync()
    finalStatus = status
  }
  if (finalStatus !== 'granted') return null

  const token = (await Notifications.getExpoPushTokenAsync()).data
  const deviceId = await getDeviceId()
  await registerDevice(deviceId, token, Platform.OS, { authToken: _authToken, notifyEnabled: true }).catch(() => {})
  return token
}

export async function getNotificationStatus(): Promise<'granted' | 'denied' | 'undetermined'> {
  const { status } = await Notifications.getPermissionsAsync()
  return status
}
