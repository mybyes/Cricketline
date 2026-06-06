import { useCallback, useEffect, useState } from 'react'
import {
  ActivityIndicator,
  FlatList,
  RefreshControl,
  StyleSheet,
  Text,
  View,
} from 'react-native'
import { useNavigation } from '@react-navigation/native'
import type { NativeStackNavigationProp } from '@react-navigation/native-stack'
import { SafeAreaView } from 'react-native-safe-area-context'
import { fetchLiveMatches } from '../lib/api'
import { MatchCard } from '../components/MatchCard'
import type { Match, RootStackParamList } from '../types/match'
import { colors } from '../theme/colors'

type Nav = NativeStackNavigationProp<RootStackParamList, 'Home'>

export function HomeScreen() {
  const navigation = useNavigation<Nav>()
  const [matches, setMatches] = useState<Match[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true)
    else setLoading(true)
    setError(null)
    try {
      const res = await fetchLiveMatches()
      if (!res.success) throw new Error(res.error ?? 'API error')
      setMatches(res.data)
    } catch (e: any) {
      setError(e.message ?? 'Failed to load matches')
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [])

  useEffect(() => {
    load()
    const id = setInterval(() => load(true), 10_000)
    return () => clearInterval(id)
  }, [load])

  const liveCount = matches.filter((m) => m.matchStarted && !m.matchEnded).length

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <View>
          <Text style={styles.brand}>CricketFast</Text>
          <Text style={styles.tagline}>Live cricket scores</Text>
        </View>
        {!loading && !error && (
          <View style={styles.countBadge}>
            <Text style={styles.countNum}>{matches.length}</Text>
            <Text style={styles.countLabel}>matches</Text>
          </View>
        )}
      </View>

      {!loading && !error && liveCount > 0 && (
        <View style={styles.liveBar}>
          <View style={styles.liveDot} />
          <Text style={styles.liveText}>{liveCount} live now</Text>
        </View>
      )}

      {loading && !refreshing ? (
        <ActivityIndicator color={colors.accent} style={styles.loader} />
      ) : error ? (
        <View style={styles.center}>
          <Text style={styles.errorTitle}>Couldn't load scores</Text>
          <Text style={styles.error}>{error}</Text>
        </View>
      ) : (
        <FlatList
          data={matches}
          keyExtractor={(m) => m.id}
          renderItem={({ item }) => (
            <MatchCard
              match={item}
              onPress={() =>
                navigation.navigate('Scoreboard', {
                  matchId: item.id,
                  matchName: item.teams.join(' vs '),
                })
              }
            />
          )}
          contentContainerStyle={styles.list}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => load(true)}
              tintColor={colors.accent}
            />
          }
          ListEmptyComponent={
            <Text style={styles.empty}>No live matches right now</Text>
          }
        />
      )}
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 16,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  brand: { fontSize: 26, fontWeight: '800', color: colors.text, letterSpacing: -0.5 },
  tagline: { fontSize: 13, color: colors.textMuted, marginTop: 2 },
  countBadge: {
    alignItems: 'center',
    backgroundColor: colors.surfaceRaised,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
  },
  countNum: { fontSize: 20, fontWeight: '800', color: colors.accent },
  countLabel: { fontSize: 10, color: colors.textDim, marginTop: 1 },
  liveBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 20,
    paddingVertical: 10,
    backgroundColor: 'rgba(34,197,94,0.08)',
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  liveDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: colors.accent },
  liveText: { fontSize: 13, fontWeight: '600', color: colors.accent },
  list: { padding: 16, paddingBottom: 32 },
  loader: { marginTop: 48 },
  center: { flex: 1, justifyContent: 'center', padding: 32 },
  errorTitle: { fontSize: 18, fontWeight: '600', color: colors.text, textAlign: 'center' },
  error: { color: colors.textMuted, fontSize: 14, textAlign: 'center', marginTop: 8 },
  empty: { color: colors.textDim, textAlign: 'center', marginTop: 48, fontSize: 15 },
})
