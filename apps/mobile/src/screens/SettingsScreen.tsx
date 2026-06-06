import { useCallback, useEffect, useState } from 'react'
import { Alert, Platform, Pressable, StyleSheet, Text, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import Constants from 'expo-constants'
import { AppHeader } from '../components/AppHeader'
import { getApiUrl } from '../lib/api'
import { getDeviceId } from '../lib/device'
import { getNotificationStatus, registerForPushNotifications } from '../lib/notifications'
import { colors } from '../theme/colors'

const APP_VERSION = Constants.expoConfig?.version ?? '1.0.0'

export function SettingsScreen() {
  const [notif, setNotif] = useState('Checking…')
  const [showAdvanced, setShowAdvanced] = useState(false)
  const [deviceId, setDeviceId] = useState('')

  const refresh = useCallback(async () => {
    setNotif(Platform.OS === 'web' ? 'Available on Android & iOS app' : await getNotificationStatus())
    if (showAdvanced) setDeviceId(await getDeviceId())
  }, [showAdvanced])

  useEffect(() => { refresh() }, [refresh])

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <AppHeader title="Settings" subtitle="No login required" />

      <View style={styles.section}>
        <Text style={styles.label}>ABOUT</Text>
        <View style={styles.card}>
          <Text style={styles.title}>CricketFast</Text>
          <Text style={styles.val}>Version {APP_VERSION}</Text>
          <Text style={styles.hint}>Live cricket scores, scorecards and fixtures. Free — no account needed.</Text>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.label}>SAVED MATCHES</Text>
        <View style={styles.card}>
          <Text style={styles.val}>Tap ★ on any match to save it here.</Text>
          <Text style={styles.hint}>Saved on this device and synced in the background — no sign-up.</Text>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.label}>MATCH ALERTS</Text>
        <View style={styles.card}>
          <Text style={styles.val}>{notif}</Text>
          <Text style={styles.hint}>Register your device for match alerts (delivery coming in a future update).</Text>
          {Platform.OS !== 'web' && (
            <Pressable
              style={styles.btn}
              onPress={async () => {
                await registerForPushNotifications()
                await refresh()
                Alert.alert('Done', 'Match alerts updated.')
              }}
            >
              <Text style={styles.btnT}>Enable Match Alerts</Text>
            </Pressable>
          )}
        </View>
      </View>

      <View style={styles.section}>
        <Pressable onPress={() => setShowAdvanced((v) => !v)}>
          <Text style={styles.advancedToggle}>{showAdvanced ? '▾ Hide developer info' : '▸ Developer info'}</Text>
        </Pressable>
        {showAdvanced && (
          <View style={[styles.card, { marginTop: 8 }]}>
            <Text style={styles.advLabel}>API</Text>
            <Text style={styles.mono}>{getApiUrl()}</Text>
            <Text style={[styles.advLabel, { marginTop: 12 }]}>Device ID</Text>
            <Text style={styles.mono}>{deviceId || '…'}</Text>
          </View>
        )}
      </View>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  section: { marginTop: 16, paddingHorizontal: 12 },
  label: { fontSize: 11, fontWeight: '800', color: colors.textDim, letterSpacing: 1, marginBottom: 6, marginLeft: 4 },
  card: { backgroundColor: colors.card, borderRadius: 6, padding: 16, borderWidth: 1, borderColor: colors.border },
  title: { fontSize: 16, fontWeight: '800', color: colors.text, marginBottom: 4 },
  val: { fontSize: 13, color: colors.text, lineHeight: 20 },
  hint: { fontSize: 12, color: colors.textDim, marginTop: 8, lineHeight: 18 },
  btn: { marginTop: 12, backgroundColor: colors.header, paddingVertical: 12, borderRadius: 6, alignItems: 'center' },
  btnT: { color: '#fff', fontWeight: '700', fontSize: 13 },
  advancedToggle: { fontSize: 12, color: colors.textDim, marginLeft: 4 },
  advLabel: { fontSize: 10, fontWeight: '700', color: colors.textDim, letterSpacing: 0.5, marginBottom: 4 },
  mono: { fontSize: 11, color: colors.textMuted, fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace' },
})
