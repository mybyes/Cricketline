import { useCallback, useEffect, useState } from 'react'
import { Alert, Platform, Pressable, StyleSheet, Text, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { getApiUrl } from '../lib/api'
import { getDeviceId } from '../lib/device'
import { getNotificationStatus, registerForPushNotifications } from '../lib/notifications'
import { colors } from '../theme/colors'

export function SettingsScreen() {
  const [deviceId, setDeviceId] = useState('')
  const [notifStatus, setNotifStatus] = useState<string>('checking...')

  const refresh = useCallback(async () => {
    setDeviceId(await getDeviceId())
    if (Platform.OS === 'web') {
      setNotifStatus('not available on web')
    } else {
      setNotifStatus(await getNotificationStatus())
    }
  }, [])

  useEffect(() => { refresh() }, [refresh])

  const enablePush = async () => {
    const token = await registerForPushNotifications()
    await refresh()
    if (token) {
      Alert.alert('Notifications enabled', 'You will receive alerts for favorite matches.')
    } else {
      Alert.alert('Permission denied', 'Enable notifications in your device settings.')
    }
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.title}>Settings</Text>
        <Text style={styles.subtitle}>No login required — open and go</Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>API</Text>
        <View style={styles.card}>
          <Text style={styles.label}>Backend URL</Text>
          <Text style={styles.value}>{getApiUrl()}</Text>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Notifications</Text>
        <View style={styles.card}>
          <Text style={styles.label}>Status</Text>
          <Text style={styles.value}>{notifStatus}</Text>
          {Platform.OS !== 'web' && (
            <Pressable style={styles.btn} onPress={enablePush}>
              <Text style={styles.btnText}>Enable push notifications</Text>
            </Pressable>
          )}
          <Text style={styles.hint}>
            Get alerts when your favorite matches start or key events happen.
          </Text>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Device</Text>
        <View style={styles.card}>
          <Text style={styles.label}>Device ID</Text>
          <Text style={styles.valueSmall}>{deviceId || '...'}</Text>
          <Text style={styles.hint}>
            Anonymous device ID — favorites work without an account. No sign-up, no password.
          </Text>
        </View>
      </View>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  header: {
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 16,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  title: { fontSize: 22, fontWeight: '800', color: colors.text },
  subtitle: { fontSize: 13, color: colors.textMuted, marginTop: 2 },
  section: { paddingHorizontal: 16, marginTop: 20 },
  sectionTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.textDim,
    letterSpacing: 1,
    marginBottom: 8,
    textTransform: 'uppercase',
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.border,
  },
  label: { fontSize: 12, color: colors.textDim, marginBottom: 4 },
  value: { fontSize: 14, color: colors.text, fontWeight: '500' },
  valueSmall: { fontSize: 12, color: colors.textMuted, fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace' },
  hint: { fontSize: 12, color: colors.textDim, marginTop: 10, lineHeight: 18 },
  btn: {
    marginTop: 12,
    backgroundColor: colors.accentDim,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  btnText: { color: colors.accent, fontWeight: '700', fontSize: 14 },
})
