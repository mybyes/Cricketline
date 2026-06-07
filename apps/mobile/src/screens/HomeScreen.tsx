import { useCallback, useEffect, useRef, useState } from 'react'
import { RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native'
import { useNavigation } from '@react-navigation/native'
import type { NativeStackNavigationProp } from '@react-navigation/native-stack'
import { SafeAreaView } from 'react-native-safe-area-context'
import { AppHeader } from '../components/AppHeader'
import { MatchCard } from '../components/MatchCard'
import { MatchCardSkeleton } from '../components/MatchCardSkeleton'
import { StaleBanner } from '../components/StaleBanner'
import { useFavorites } from '../context/FavoritesContext'
import { fetchLiveMatches, fetchRecentMatches, fetchUpcomingMatches } from '../lib/api'
import { friendlyLimitMessage, loadHomeCache, saveHomeCache } from '../lib/matchCache'
import type { Match, RootStackParamList } from '../types/match'
import { colors } from '../theme/colors'

type Nav = NativeStackNavigationProp<RootStackParamList>

const POLL_LIVE_MS = 15_000
const POLL_STALE_MS = 60_000

export function HomeScreen() {
  const navigation = useNavigation<Nav>()
  const { favoriteIds, toggle } = useFavorites()
  const [live, setLive] = useState<Match[]>([])
  const [recent, setRecent] = useState<Match[]>([])
  const [upcoming, setUpcoming] = useState<Match[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [stale, setStale] = useState(false)
  const [notice, setNotice] = useState<string | null>(null)
  const hasData = useRef(false)

  const load = useCallback(async (pull = false) => {
    if (pull) setRefreshing(true)
    else if (!hasData.current) setLoading(true)

    const [l, r, u] = await Promise.all([
      fetchLiveMatches(),
      fetchRecentMatches(),
      fetchUpcomingMatches(),
    ])

    const anyOk = l.success || r.success || u.success
    const isStale = !!(l.stale || r.stale || u.stale)

    if (anyOk) {
      const prev = await loadHomeCache()
      const nextLive = l.success ? (l.data ?? []) : (prev?.live ?? [])
      const nextRecent = r.success ? (r.data ?? []) : (prev?.recent ?? [])
      const nextUpcoming = u.success ? (u.data ?? []) : (prev?.upcoming ?? [])
      setLive(nextLive)
      setRecent(nextRecent)
      setUpcoming(nextUpcoming)
      await saveHomeCache(nextLive, nextRecent, nextUpcoming)
      hasData.current = true
      setStale(isStale)
      setNotice(isStale ? friendlyLimitMessage(l.error ?? r.error ?? u.error) : null)
    } else {
      const cached = await loadHomeCache()
      if (cached && (cached.live.length || cached.recent.length || cached.upcoming.length)) {
        setLive(cached.live)
        setRecent(cached.recent)
        setUpcoming(cached.upcoming)
        hasData.current = true
        setStale(true)
        setNotice(friendlyLimitMessage(l.error ?? r.error ?? u.error))
      } else {
        setNotice(l.error ?? r.error ?? u.error ?? 'Could not load scores')
      }
    }

    setLoading(false)
    setRefreshing(false)
  }, [])

  useEffect(() => {
    load()
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    const ms = stale ? POLL_STALE_MS : POLL_LIVE_MS
    const poll = setInterval(() => load(false), ms)
    return () => clearInterval(poll)
  }, [load, stale])

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

  const showList = hasData.current && !loading

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <AppHeader title="CricketFast" subtitle="Live cricket line" right={
        showList ? <View style={styles.pill}><Text style={styles.pillT}>{live.length}</Text></View> : undefined
      } />
      {stale && notice && <StaleBanner message={notice} />}
      {loading && !refreshing && !hasData.current ? (
        <View style={{ paddingTop: 8 }}>
          <MatchCardSkeleton />
          <MatchCardSkeleton />
          <MatchCardSkeleton />
        </View>
      ) : showList ? (
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
      ) : (
        <Text style={styles.error}>{notice ?? 'Could not load scores'}</Text>
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
