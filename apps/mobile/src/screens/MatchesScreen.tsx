import { useCallback, useEffect, useRef, useState } from 'react'
import { RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native'
import { useNavigation } from '@react-navigation/native'
import type { NativeStackNavigationProp } from '@react-navigation/native-stack'
import { SafeAreaView } from 'react-native-safe-area-context'
import { AdSlot } from '../components/AdSlot'
import { AppHeader } from '../components/AppHeader'
import { FeedPausedCard } from '../components/FeedPausedCard'
import { MatchCard } from '../components/MatchCard'
import { MatchCardSkeleton } from '../components/MatchCardSkeleton'
import { StaleBanner } from '../components/StaleBanner'
import { useFavorites } from '../context/FavoritesContext'
import { staleNotice } from '../lib/cacheTime'
import {
  fetchLiveIntelligence, fetchLiveMatches, fetchLiveOdds, fetchRecentMatches, fetchUpcomingMatches,
} from '../lib/api'
import { loadHomeCache, mergeMatchList, saveHomeCache } from '../lib/matchCache'
import type { MatchIntelligenceCard } from '../types/intelligence'
import type { Match, RootStackParamList } from '../types/match'
import type { MatchOddsBoard } from '../types/odds'
import { colors } from '../theme/colors'
import { seriesName } from '../theme/matchUtils'

type Nav = NativeStackNavigationProp<RootStackParamList>

const POLL_MS = 30_000

export function MatchesScreen() {
  const navigation = useNavigation<Nav>()
  const { favoriteIds, toggle } = useFavorites()
  const [live, setLive] = useState<Match[]>([])
  const [upcoming, setUpcoming] = useState<Match[]>([])
  const [recent, setRecent] = useState<Match[]>([])
  const [oddsById, setOddsById] = useState<Record<string, MatchOddsBoard>>({})
  const [intelById, setIntelById] = useState<Record<string, MatchIntelligenceCard>>({})
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [stale, setStale] = useState(false)
  const [notice, setNotice] = useState<string | null>(null)
  const bootstrapped = useRef(false)

  const load = useCallback(async (opts?: { pull?: boolean; silent?: boolean }) => {
    const pull = opts?.pull ?? false
    const silent = opts?.silent ?? false
    if (pull) setRefreshing(true)
    else if (!silent) setLoading(true)

    const [l, u, r, o, intel] = await Promise.all([
      fetchLiveMatches(),
      fetchUpcomingMatches(),
      fetchRecentMatches(),
      fetchLiveOdds(),
      fetchLiveIntelligence(),
    ])

    if (o.success && Array.isArray(o.data)) {
      const map: Record<string, MatchOddsBoard> = {}
      for (const board of o.data) map[board.matchId] = board
      setOddsById(map)
    }
    if (intel.success && Array.isArray(intel.data)) {
      const map: Record<string, MatchIntelligenceCard> = {}
      for (const card of intel.data) map[card.matchId] = card
      setIntelById(map)
    }

    const disk = await loadHomeCache()
    const nextLive = mergeMatchList(l.data, disk?.live ?? [])
    const nextUpcoming = mergeMatchList(u.data, disk?.upcoming ?? [])
    const nextRecent = mergeMatchList(r.data, disk?.recent ?? [])

    setLive(nextLive)
    setUpcoming(nextUpcoming)
    setRecent(nextRecent)

    const hasRows = nextLive.length + nextUpcoming.length + nextRecent.length > 0
    if (hasRows) await saveHomeCache(nextLive, nextRecent, nextUpcoming)

    const isStale = !!(l.stale || u.stale || r.stale)
    setStale(isStale && hasRows)
    setNotice(isStale && hasRows ? staleNotice(Math.max(l.cachedAt ?? 0, u.cachedAt ?? 0, r.cachedAt ?? 0) || undefined) : null)
    setLoading(false)
    setRefreshing(false)
  }, [])

  useEffect(() => {
    if (bootstrapped.current) return
    bootstrapped.current = true
    load()
  }, [load])

  useEffect(() => {
    const poll = setInterval(() => load({ silent: true }), POLL_MS)
    return () => clearInterval(poll)
  }, [load])

  const open = (m: Match) => navigation.navigate('Scoreboard', {
    matchId: m.id,
    matchName: m.teams.join(' vs '),
    seriesId: m.series_id,
    matchType: m.matchType,
  })

  const openSeriesTable = (m: Match) => {
    if (!m.series_id) return
    navigation.navigate('SeriesTable', { seriesId: m.series_id, seriesName: seriesName(m) })
  }

  const total = live.length + upcoming.length + recent.length
  const showSkeleton = loading && !refreshing && total === 0

  const section = (title: string, data: Match[], showDate: boolean) => (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{title}</Text>
      {data.length > 0 ? data.map((m, idx) => (
        <View key={m.id}>
          <MatchCard
            match={m}
            showDate={showDate}
            isFavorite={favoriteIds.has(m.id)}
            onToggleFavorite={() => toggle(m)}
            onPress={() => open(m)}
            odds={oddsById[m.id] ?? null}
            intel={intelById[m.id] ?? null}
            onOpenTable={m.series_id ? () => openSeriesTable(m) : undefined}
          />
          {idx === 1 ? <AdSlot size="inline" /> : null}
        </View>
      )) : (
        <Text style={styles.empty}>Nothing here yet</Text>
      )}
    </View>
  )

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <AppHeader title="Matches" subtitle="Live · fixtures · results" />
      {showSkeleton ? (
        <View style={{ paddingTop: 8 }}>
          <MatchCardSkeleton />
          <MatchCardSkeleton />
        </View>
      ) : (
        <ScrollView
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => load({ pull: true })} tintColor={colors.accent} />}
          contentContainerStyle={styles.scroll}
        >
          {stale && notice ? <View style={styles.bannerWrap}><StaleBanner message={notice} /></View> : null}
          {total === 0 && !loading ? <FeedPausedCard onRetry={() => load({ pull: true })} /> : null}
          {section('Live now', live, false)}
          {section('Upcoming', upcoming, true)}
          {section('Recent results', recent.slice(0, 12), true)}
        </ScrollView>
      )}
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  scroll: { paddingBottom: 24 },
  bannerWrap: { marginBottom: 4 },
  section: { marginTop: 8 },
  sectionTitle: {
    fontSize: 11, fontWeight: '800', color: colors.textDim, letterSpacing: 1,
    marginLeft: 16, marginBottom: 6, marginTop: 8,
  },
  empty: { color: colors.textDim, textAlign: 'center', marginVertical: 16, fontSize: 13 },
})
