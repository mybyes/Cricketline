import { useCallback, useEffect, useRef, useState } from 'react'
import { ActivityIndicator, FlatList, Pressable, RefreshControl, StyleSheet, Text, View } from 'react-native'
import { useNavigation } from '@react-navigation/native'
import type { NativeStackNavigationProp } from '@react-navigation/native-stack'
import { AppHeader } from './AppHeader'
import { MatchCard } from './MatchCard'
import { useFavorites } from '../context/FavoritesContext'
import type { Match, RootStackParamList } from '../types/match'
import { colors } from '../theme/colors'

type Nav = NativeStackNavigationProp<RootStackParamList>

interface Props {
  headerTitle: string
  headerSubtitle: string
  emptyText: string
  fetcher: () => Promise<{ success: boolean; data: Match[]; error?: string; stale?: boolean }>
  pollMs: number
  showDate?: boolean
}

export function MatchList({ headerTitle, headerSubtitle, emptyText, fetcher, pollMs, showDate }: Props) {
  const navigation = useNavigation<Nav>()
  const { favoriteIds, toggle } = useFavorites()
  const [matches, setMatches] = useState<Match[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [stale, setStale] = useState(false)
  const lastFetch = useRef(Date.now())
  const [tick, setTick] = useState(0)

  const load = useCallback(async (opts?: { pull?: boolean; silent?: boolean }) => {
    const pull = opts?.pull ?? false
    const silent = opts?.silent ?? false
    if (pull) setRefreshing(true)
    else if (!silent) setLoading(true)
    setError(null)
    try {
      const res = await fetcher()
      if (!res.success) throw new Error(res.error ?? 'API error')
      setMatches(res.data)
      setStale(!!res.stale)
      lastFetch.current = Date.now()
      setTick((t) => t + 1)
    } catch (e: any) {
      setError(e.message ?? 'Failed to load')
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [fetcher])

  useEffect(() => {
    load()
    const poll = setInterval(() => load({ silent: true }), pollMs)
    const clock = setInterval(() => setTick((t) => t + 1), 1000)
    return () => { clearInterval(poll); clearInterval(clock) }
  }, [load, pollMs])

  const updatedAgo = Math.floor((Date.now() - lastFetch.current) / 1000)
  const liveCount = matches.filter((m) => m.matchStarted && !m.matchEnded).length

  return (
    <View style={styles.container}>
      <AppHeader
        title={headerTitle}
        subtitle={headerSubtitle}
        right={!loading && !error ? (
          <View style={styles.countPill}><Text style={styles.countText}>{matches.length}</Text></View>
        ) : undefined}
      />

      {stale && (
        <View style={styles.staleBar}><Text style={styles.staleText}>Showing cached scores — API rate limited</Text></View>
      )}

      {liveCount > 0 && headerTitle === 'CricketFast' && (
        <View style={styles.liveBar}>
          <View style={styles.liveDot} />
          <Text style={styles.liveText}>{liveCount} live · refreshes every {pollMs / 1000}s</Text>
        </View>
      )}

      {loading && !refreshing ? (
        <ActivityIndicator color={colors.accent} style={styles.loader} />
      ) : error ? (
        <View style={styles.center}>
          <Text style={styles.errorTitle}>Couldn't load scores</Text>
          <Text style={styles.error}>{error}</Text>
          <Pressable onPress={() => load({})} style={styles.retryBtn}>
            <Text style={styles.retryText}>Retry</Text>
          </Pressable>
        </View>
      ) : (
        <FlatList
          data={matches}
          keyExtractor={(m) => m.id}
          extraData={tick}
          renderItem={({ item }) => (
            <MatchCard
              match={item}
              showDate={showDate}
              updatedAgo={updatedAgo}
              isFavorite={favoriteIds.has(item.id)}
              onToggleFavorite={() => toggle(item)}
              onPress={() => navigation.navigate('Scoreboard', { matchId: item.id, matchName: item.teams.join(' vs ') })}
            />
          )}
          contentContainerStyle={styles.list}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => load({ pull: true })} tintColor={colors.accent} />}
          ListEmptyComponent={<Text style={styles.empty}>{emptyText}</Text>}
        />
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  countPill: { backgroundColor: 'rgba(255,255,255,0.2)', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
  countText: { color: '#fff', fontWeight: '800', fontSize: 14 },
  staleBar: { backgroundColor: colors.gold, paddingVertical: 6, paddingHorizontal: 16 },
  staleText: { fontSize: 11, fontWeight: '600', color: '#333', textAlign: 'center' },
  liveBar: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 16, paddingVertical: 8, backgroundColor: colors.surfaceAlt },
  liveDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: colors.live },
  liveText: { fontSize: 12, fontWeight: '600', color: colors.score },
  list: { paddingTop: 8, paddingBottom: 24 },
  loader: { marginTop: 48 },
  center: { flex: 1, justifyContent: 'center', padding: 32 },
  errorTitle: { fontSize: 16, fontWeight: '700', color: colors.text, textAlign: 'center' },
  error: { color: colors.textMuted, fontSize: 13, textAlign: 'center', marginTop: 8 },
  retryBtn: { marginTop: 16, backgroundColor: colors.header, paddingHorizontal: 20, paddingVertical: 10, borderRadius: 6 },
  retryText: { color: '#fff', fontWeight: '600', fontSize: 14 },
  empty: { color: colors.textDim, textAlign: 'center', marginTop: 48, fontSize: 14 },
})
