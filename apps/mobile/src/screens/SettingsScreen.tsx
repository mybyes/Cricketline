import { useCallback, useEffect, useState } from 'react'
import { Image, Linking, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native'
import { useNavigation } from '@react-navigation/native'
import type { NativeStackNavigationProp } from '@react-navigation/native-stack'
import { SafeAreaView } from 'react-native-safe-area-context'
import Constants from 'expo-constants'
import { AppHeader } from '../components/AppHeader'
import { useAuth } from '../context/AuthContext'
import { getApiUrl } from '../lib/api'
import { getDeviceId } from '../lib/device'
import type { RootStackParamList } from '../types/match'
import { colors } from '../theme/colors'

type Nav = NativeStackNavigationProp<RootStackParamList>

const APP_VERSION = Constants.expoConfig?.version ?? '1.0.0'
const SITE = (process.env.EXPO_PUBLIC_SITE_URL ?? 'https://cricketline-mybyes.vercel.app').replace(/\/$/, '')

function Row({
  label, onPress, last,
}: { label: string; onPress: () => void; last?: boolean }) {
  return (
    <Pressable onPress={onPress} style={[styles.row, !last && styles.rowBorder]} accessibilityRole="button">
      <Text style={styles.rowLabel}>{label}</Text>
      <Text style={styles.chev}>›</Text>
    </Pressable>
  )
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <View style={styles.section}>
      <Text style={styles.label}>{title}</Text>
      <View style={styles.card}>{children}</View>
    </View>
  )
}

/** More hub — browse / follow / legal (footer chrome lives here, not on Home). */
export function SettingsScreen() {
  const navigation = useNavigation<Nav>()
  const { user, enabled, signIn, signOut } = useAuth()
  const [showAdvanced, setShowAdvanced] = useState(false)
  const [deviceId, setDeviceId] = useState('')

  const refresh = useCallback(async () => {
    if (showAdvanced) setDeviceId(await getDeviceId())
  }, [showAdvanced])

  useEffect(() => { refresh() }, [refresh])

  const open = (path: string) => { void Linking.openURL(`${SITE}${path}`) }

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <AppHeader title="More" subtitle={user ? user.name ?? 'Signed in' : 'Live cricket · smart insights'} />
      <ScrollView contentContainerStyle={styles.scroll}>
        {enabled && (
          <Section title="Account">
            {user ? (
              <View style={styles.pad}>
                <View style={styles.profileRow}>
                  {user.picture
                    ? <Image source={{ uri: user.picture }} style={styles.avatar} />
                    : (
                      <View style={styles.avatarFallback}>
                        <Text style={styles.avatarTxt}>{(user.name ?? user.email ?? '?').slice(0, 1).toUpperCase()}</Text>
                      </View>
                    )}
                  <View style={{ flex: 1 }}>
                    <Text style={styles.title}>{user.name ?? 'Signed in'}</Text>
                    {!!user.email && <Text style={styles.hint} numberOfLines={1}>{user.email}</Text>}
                  </View>
                </View>
                <Pressable style={styles.signOutBtn} onPress={() => signOut()}>
                  <Text style={styles.signOutTxt}>Sign out</Text>
                </Pressable>
              </View>
            ) : (
              <View style={styles.pad}>
                <Text style={styles.val}>Optional sign-in for syncing saved matches.</Text>
                <Pressable style={styles.googleBtn} onPress={() => signIn()}>
                  <View style={styles.googleG}><Text style={styles.googleGTxt}>G</Text></View>
                  <Text style={styles.googleTxt}>Sign in with Google</Text>
                </Pressable>
              </View>
            )}
          </Section>
        )}

        <Section title="Browse cricket">
          <Row label="Saved matches" onPress={() => navigation.navigate('Favorites')} />
          <Row label="All matches" onPress={() => navigation.getParent()?.navigate('Matches' as never)} />
          <Row label="Series" onPress={() => navigation.getParent()?.navigate('Series' as never)} last />
        </Section>

        <Section title="Follow us">
          <Row
            label="X · @ChaiPeCric"
            onPress={() => { void Linking.openURL('https://x.com/ChaiPeCric') }}
            last
          />
        </Section>

        <Section title="Info & legal">
          <Row label="About Cricket Pulse" onPress={() => open('/about')} />
          <Row label="How insights work" onPress={() => open('/methodology')} />
          <Row label="Privacy policy" onPress={() => open('/privacy')} />
          <Row label="Terms of use" onPress={() => open('/terms')} last />
        </Section>

        <Text style={styles.version}>
          Version {APP_VERSION}
          {'\n'}
          Live cricket · smart insights · Not affiliated with ICC or BCCI
        </Text>

        <Pressable onPress={() => setShowAdvanced((v) => !v)} style={styles.advancedToggle}>
          <Text style={styles.advancedTxt}>{showAdvanced ? '▾ Hide developer info' : '▸ Developer info'}</Text>
        </Pressable>
        {showAdvanced ? (
          <View style={[styles.card, styles.devCard]}>
            <Text style={styles.advLabel}>API</Text>
            <Text style={styles.mono}>{getApiUrl()}</Text>
            <Text style={[styles.advLabel, { marginTop: 12 }]}>Device ID</Text>
            <Text style={styles.mono}>{deviceId || '…'}</Text>
          </View>
        ) : null}
      </ScrollView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  scroll: { paddingBottom: 40 },
  section: { paddingHorizontal: 16, marginTop: 18 },
  label: { fontSize: 11, fontWeight: '800', color: colors.textDim, letterSpacing: 0.8, marginBottom: 8 },
  card: {
    backgroundColor: colors.card, borderRadius: 10, overflow: 'hidden',
    borderWidth: 1, borderColor: colors.border,
  },
  pad: { padding: 14 },
  row: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 14, paddingVertical: 14,
  },
  rowBorder: { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.border },
  rowLabel: { fontSize: 15, fontWeight: '700', color: colors.text },
  chev: { fontSize: 18, color: colors.textDim, fontWeight: '300' },
  title: { fontSize: 16, fontWeight: '800', color: colors.text },
  val: { fontSize: 14, color: colors.text, lineHeight: 20 },
  hint: { fontSize: 12, color: colors.textDim, marginTop: 6, lineHeight: 17 },
  profileRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  avatar: { width: 44, height: 44, borderRadius: 22 },
  avatarFallback: {
    width: 44, height: 44, borderRadius: 22, backgroundColor: colors.header,
    alignItems: 'center', justifyContent: 'center',
  },
  avatarTxt: { color: '#fff', fontWeight: '800', fontSize: 18 },
  signOutBtn: {
    marginTop: 12, alignSelf: 'flex-start', paddingVertical: 8, paddingHorizontal: 14,
    borderRadius: 6, backgroundColor: colors.bg,
  },
  signOutTxt: { fontWeight: '700', color: colors.live },
  googleBtn: {
    marginTop: 12, flexDirection: 'row', alignItems: 'center', gap: 10,
    backgroundColor: colors.bg, borderWidth: 1, borderColor: colors.border,
    borderRadius: 8, paddingVertical: 10, paddingHorizontal: 12,
  },
  googleG: {
    width: 22, height: 22, borderRadius: 11, backgroundColor: '#fff',
    alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: colors.border,
  },
  googleGTxt: { fontWeight: '900', color: '#4285F4' },
  googleTxt: { fontWeight: '700', color: colors.text },
  version: {
    marginTop: 22, textAlign: 'center', fontSize: 12, color: colors.textDim, lineHeight: 18,
    paddingHorizontal: 24,
  },
  advancedToggle: { marginTop: 16, paddingHorizontal: 16 },
  advancedTxt: { fontSize: 12, fontWeight: '700', color: colors.textDim },
  devCard: { marginHorizontal: 16, marginTop: 8, padding: 14 },
  advLabel: { fontSize: 10, fontWeight: '800', color: colors.textDim, letterSpacing: 0.5 },
  mono: { fontSize: 11, color: colors.textMuted, marginTop: 4 },
})
