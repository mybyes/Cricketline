import { useCallback, useEffect, useState } from 'react'
import { Alert, Image, Platform, Pressable, StyleSheet, Text, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import Constants from 'expo-constants'
import { AppHeader } from '../components/AppHeader'
import { useAuth } from '../context/AuthContext'
import { getApiUrl } from '../lib/api'
import { getDeviceId } from '../lib/device'
import { getNotificationStatus, registerForPushNotifications } from '../lib/notifications'
import { colors } from '../theme/colors'

const APP_VERSION = Constants.expoConfig?.version ?? '1.0.0'

export function SettingsScreen() {
  const { user, token, enabled, signIn, signOut } = useAuth()
  const [notif, setNotif] = useState('Checking…')
  const [showAdvanced, setShowAdvanced] = useState(false)
  const [deviceId, setDeviceId] = useState('')

  const refresh = useCallback(async () => {
    setNotif(Platform.OS === 'web' ? 'Available on Android & iOS app' : await getNotificationStatus())
    if (showAdvanced) setDeviceId(await getDeviceId())
  }, [showAdvanced])

  useEffect(() => { refresh() }, [refresh])

  // Notifications require sign-in only when auth is actually configured; otherwise
  // (demo builds) keep the original anonymous opt-in so the feature still works.
  const needsSignIn = enabled && !user

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <AppHeader title="Settings" subtitle={user ? user.name ?? 'Signed in' : 'Live scores, no fuss'} />

      {enabled && (
        <View style={styles.section}>
          <Text style={styles.label}>ACCOUNT</Text>
          <View style={styles.card}>
            {user ? (
              <>
                <View style={styles.profileRow}>
                  {user.picture
                    ? <Image source={{ uri: user.picture }} style={styles.avatar} />
                    : <View style={styles.avatarFallback}><Text style={styles.avatarTxt}>{(user.name ?? user.email ?? '?').slice(0, 1).toUpperCase()}</Text></View>}
                  <View style={{ flex: 1 }}>
                    <Text style={styles.title}>{user.name ?? 'Signed in'}</Text>
                    {!!user.email && <Text style={styles.hint} numberOfLines={1}>{user.email}</Text>}
                  </View>
                </View>
                <Pressable style={styles.signOutBtn} onPress={() => signOut()}>
                  <Text style={styles.signOutTxt}>Sign out</Text>
                </Pressable>
              </>
            ) : (
              <>
                <Text style={styles.val}>Sign in to turn on match alerts and keep them across devices.</Text>
                <Pressable style={styles.googleBtn} onPress={() => signIn()}>
                  <View style={styles.googleG}><Text style={styles.googleGTxt}>G</Text></View>
                  <Text style={styles.googleTxt}>Sign in with Google</Text>
                </Pressable>
              </>
            )}
          </View>
        </View>
      )}

      <View style={styles.section}>
        <Text style={styles.label}>ABOUT</Text>
        <View style={styles.card}>
          <Text style={styles.title}>CricketFast</Text>
          <Text style={styles.val}>Version {APP_VERSION}</Text>
          <Text style={styles.hint}>Live cricket scores, scorecards and fixtures. Free to use.</Text>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.label}>SAVED MATCHES</Text>
        <View style={styles.card}>
          <Text style={styles.val}>Tap ★ on any match to save it here.</Text>
          <Text style={styles.hint}>Saved on this device and synced in the background.</Text>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.label}>MATCH ALERTS</Text>
        <View style={styles.card}>
          <Text style={styles.val}>{notif}</Text>
          <Text style={styles.hint}>Save a match with ★ and enable alerts — you&apos;ll get a push when a wicket falls.</Text>
          {Platform.OS !== 'web' && (
            needsSignIn ? (
              <Pressable style={styles.googleBtn} onPress={() => signIn()}>
                <View style={styles.googleG}><Text style={styles.googleGTxt}>G</Text></View>
                <Text style={styles.googleTxt}>Sign in to enable alerts</Text>
              </Pressable>
            ) : (
              <Pressable
                style={styles.btn}
                onPress={async () => {
                  await registerForPushNotifications(token)
                  await refresh()
                  Alert.alert('Done', 'Match alerts updated.')
                }}
              >
                <Text style={styles.btnT}>Enable Match Alerts</Text>
              </Pressable>
            )
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
  profileRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  avatar: { width: 44, height: 44, borderRadius: 22 },
  avatarFallback: { width: 44, height: 44, borderRadius: 22, backgroundColor: colors.header, alignItems: 'center', justifyContent: 'center' },
  avatarTxt: { color: '#fff', fontWeight: '800', fontSize: 18 },
  signOutBtn: { marginTop: 14, paddingVertical: 11, borderRadius: 6, alignItems: 'center', borderWidth: 1, borderColor: colors.border },
  signOutTxt: { color: colors.textMuted, fontWeight: '700', fontSize: 13 },
  googleBtn: { marginTop: 12, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, backgroundColor: '#fff', paddingVertical: 12, borderRadius: 6, borderWidth: 1, borderColor: colors.border },
  googleG: { width: 20, height: 20, borderRadius: 10, backgroundColor: '#4285F4', alignItems: 'center', justifyContent: 'center' },
  googleGTxt: { color: '#fff', fontWeight: '900', fontSize: 13 },
  googleTxt: { color: '#1f2937', fontWeight: '700', fontSize: 14 },
  advancedToggle: { fontSize: 12, color: colors.textDim, marginLeft: 4 },
  advLabel: { fontSize: 10, fontWeight: '700', color: colors.textDim, letterSpacing: 0.5, marginBottom: 4 },
  mono: { fontSize: 11, color: colors.textMuted, fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace' },
})
