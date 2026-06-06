import { useCallback, useEffect, useState } from 'react'
import { RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native'
import { useNavigation } from '@react-navigation/native'
import type { NativeStackNavigationProp } from '@react-navigation/native-stack'
import { SafeAreaView } from 'react-native-safe-area-context'
import { AppHeader } from '../components/AppHeader'
import { MatchCard } from '../components/MatchCard'
import { MatchCardSkeleton } from '../components/MatchCardSkeleton'
import { useFavorites } from '../context/FavoritesContext'
import { fetchLiveMatches, fetchRecentMatches, fetchUpcomingMatches } from '../lib/api'
import type { Match, RootStackParamList } from '../types/match'
import { colors } from '../theme/colors'

type Nav = NativeStackNavigationProp<RootStackParamList>

export function HomeScreen() {
  const navigation = useNavigation<Nav>()
  const { favoriteIds, toggle } = useFavorites()
  const [live, setLive] = useState<Match[]>([])
  const [recent, setRecent] = useState<Match[]>([])
  const [upcoming, setUpcoming] = useState<Match[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async (pull = false) => {
    if (pull) setRefreshing(true)
    else setLoading(true)
    setError(null)
    try {
      const [l, r, u] = await Promise.all([fetchLiveMatches(), fetchRecentMatches(), fetchUpcomingMatches()])
      if (!l.success) throw new Error(l.error ?? 'API error')
      setLive(l.data)
      setRecent(r.data ?? [])
      setUpcoming(u.data ?? [])
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Failed to load')
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [])

  useEffect(() => {
    load()
    const poll = setInterval(() => load(false), 15_000)
    return () => clearInterval(poll)
  }, [load])

  const open = (m: Match) => navigation.navigate('Scoreboard', {
    matchId: m.id,
    matchName: m.teams.join(' vs '),
    seriesId: m.series_id,
    matchType: m.matchType,
  })

  const renderSection = (title: string, data: Match[]) => data.length ? (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{title}</Text>
      {data.map((m) => (
        <MatchCard
          key={m.id}
          match={m}
          showDate={title !== 'Live now'}
          isFavorite={favoriteIds.has(m.id)}
          onToggleFavorite={() => toggle(m)}
          onPress={() => open(m)}
        />
      ))}
    </View>
  ) : null

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <AppHeader title="CricketFast" subtitle="Live cricket line" right={
        !loading ? <View style={styles.pill}><Text style={styles.pillT}>{live.length}</Text></View> : undefined
      } />
      {loading && !refreshing ? (
        <View style={{ paddingTop: 8 }}>
          <MatchCardSkeleton />
          <MatchCardSkeleton />
          <MatchCardSkeleton />
        </View>
      ) : error ? (
        <Text style={styles.error}>{error}</Text>
      ) : (
        <ScrollView
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => load(true)} tintColor={colors.accent} />}
          contentContainerStyle={styles.scroll}
        >
          {live.length > 0 ? renderSection('Live now', live) : (
            <Text style={styles.emptyLive}>No live matches right now</Text>
          )}
          {renderSection('Recent results', recent.slice(0, 8))}
          {renderSection('Upcoming fixtures', upcoming.slice(0, 8))}
        </ScrollView>
      )}
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  pill: { backgroundColor: 'rgba(255,255,255,0.2)', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
  pillT: { color: '#fff', fontWeight: '800', fontSize: 14 },
  scroll: { paddingBottom: 24 },
  section: { marginTop: 8 },
  sectionTitle: { fontSize: 11, fontWeight: '800', color: colors.textDim, letterSpacing: 1, marginLeft: 16, marginBottom: 6, marginTop: 8 },
  emptyLive: { color: colors.textDim, textAlign: 'center', marginTop: 24, marginBottom: 8, fontSize: 14 },
  error: { color: colors.live, textAlign: 'center', marginTop: 48, padding: 16 },
})
