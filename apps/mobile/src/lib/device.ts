import AsyncStorage from '@react-native-async-storage/async-storage'
import { Platform } from 'react-native'

const DEVICE_KEY = 'cricketfast:device_id'

function uuid() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0
    return (c === 'x' ? r : (r & 0x3) | 0x8).toString(16)
  })
}

export async function getDeviceId(): Promise<string> {
  const stored = await AsyncStorage.getItem(DEVICE_KEY)
  if (stored) return stored
  const id = `${Platform.OS}-${uuid()}`
  await AsyncStorage.setItem(DEVICE_KEY, id)
  return id
}
