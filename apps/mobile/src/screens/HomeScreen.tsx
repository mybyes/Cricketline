import { useCallback, useEffect, useRef, useState } from 'react'
import { Pressable, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native'
import { useNavigation } from '@react-navigation/native'
import type { NativeStackNavigationProp } from '@react-navigation/native-stack'
import { SafeAreaView } from 'react-native-safe-area-context'
import { AppHeader } from '../components/AppHeader'
import { FeedPausedCard } from '../components/FeedPausedCard'
import { MatchCard } from '../components/MatchCard'
import { MatchCardSkeleton } from '../components/MatchCardSkeleton'
import { StaleBanner } from '../components/StaleBanner'
import { useFavorites } from '../context/FavoritesContext'
import { staleNotice } from '../lib/cacheTime'
import { fetchLiveMatches, fetchRecentMatches, fetchUpcomingMatches } from '../lib/api'
import {
  hydrateHomeFromFavorites,
  loadHomeCache,
  mergeMatchList,
  saveHomeCache,
} from '../lib/matchCache'
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
  const [tab, setTab] = useState<'featured' | 'live' | 'series'>('featured')
  const bootstrapped = useRef(false)
  const liveRef = useRef(live)
  const recentRef = useRef(recent)
  const upcomingRef = useRef(upcoming)
  liveRef.current = live
  recentRef.current = recent
  upcomingRef.current = upcoming

  const load = useCallback(async (opts?: { pull?: boolean; silent?: boolean }) => {
    const pull = opts?.pull ?? false
    const silent = opts?.silent ?? false
    if (pull) setRefreshing(true)
    else if (!silent) setLoading(true)

    const [l, r, u] = await Promise.all([
      fetchLiveMatches(),
      fetchRecentMatches(),
      fetchUpcomingMatches(),
    ])

    const disk = await loadHomeCache()
    const prevLive = liveRef.current.length ? liveRef.current : (disk?.live ?? [])
    const prevRecent = recentRef.current.length ? recentRef.current : (disk?.recent ?? [])
    const prevUpcoming = upcomingRef.current.length ? upcomingRef.current : (disk?.upcoming ?? [])
    const nextLive = mergeMatchList(l.data, prevLive)
    const nextRecent = mergeMatchList(r.data, prevRecent)
    const nextUpcoming = mergeMatchList(u.data, prevUpcoming)

    const hasRows = nextLive.length + nextRecent.length + nextUpcoming.length > 0

    if (!hasRows) {
      const fromFav = await hydrateHomeFromFavorites()
      if (fromFav.live.length || fromFav.recent.length || fromFav.upcoming.length) {
        setLive(fromFav.live)
        setRecent(fromFav.recent)
        setUpcoming(fromFav.upcoming)
        setStale(true)
        setNotice(staleNotice(disk?.savedAt))
        setLoading(false)
        setRefreshing(false)
        return
      }
    }

    setLive(nextLive)
    setRecent(nextRecent)
    setUpcoming(nextUpcoming)

    if (hasRows) await saveHomeCache(nextLive, nextRecent, nextUpcoming)

    const usedDisk = (l.data.length === 0 && nextLive.length > 0)
      || (r.data.length === 0 && nextRecent.length > 0)
      || (u.data.length === 0 && nextUpcoming.length > 0)
    const isStale = !!(l.stale || r.stale || u.stale) || usedDisk
    const cachedAt = Math.max(l.cachedAt ?? 0, r.cachedAt ?? 0, u.cachedAt ?? 0, disk?.savedAt ?? 0)

    setStale(isStale && hasRows)
    setNotice(isStale && hasRows ? staleNotice(cachedAt || undefined) : null)
    setLoading(false)
    setRefreshing(false)
  }, [])

  useEffect(() => {
    if (bootstrapped.current) return
    bootstrapped.current = true
    ;(async () => {
      const cached = await loadHomeCache()
      if (cached && (cached.live.length || cached.recent.length || cached.upcoming.length)) {
        setLive(cached.live)
        setRecent(cached.recent)
        setUpcoming(cached.upcoming)
        setStale(true)
        setNotice(staleNotice(cached.savedAt))
        setLoading(false)
      }
      await load({ silent: !!cached })
    })()
  }, [load])

  useEffect(() => {
    const ms = stale ? POLL_STALE_MS : POLL_LIVE_MS
    const poll = setInterval(() => load({ silent: true }), ms)
    return () => clearInterval(poll)
  }, [load, stale])

  const open = (m: Match) => navigation.navigate('Scoreboard', {
    matchId: m.id,
    matchName: m.teams.join(' vs '),
    seriesId: m.series_id,
    matchType: m.matchType,
  })

  const renderSection = (title: string, data: Match[]) => (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{title}</Text>
      {data.length > 0 ? data.map((m) => (
        <MatchCard
          key={m.id}
          match={m}
          showDate={title !== 'Live now'}
          isFavorite={favoriteIds.has(m.id)}
          onToggleFavorite={() => toggle(m)}
          onPress={() => open(m)}
        />
      )) : (
        <Text style={styles.sectionEmpty}>
          {title === 'Live now' ? 'No live matches right now' : `Nothing here yet`}
        </Text>
      )}
    </View>
  )

  const matchCount = live.length + recent.length + upcoming.length
  const showSkeleton = loading && !refreshing && matchCount === 0

  const featured = live[0] ?? upcoming[0] ?? recent[0]

  // Group all matches by series (last comma segment of the match name).
  const seriesGroups = (() => {
    const order: string[] = []
    const map = new Map<string, Match[]>()
    for (const m of [...live, ...upcoming, ...recent]) {
      const parts = m.name.split(',').map((s) => s.trim())
      const key = parts.length >= 2 ? parts[parts.length - 1] : (m.matchType?.toUpperCase() ?? 'Other')
      if (!map.has(key)) { map.set(key, []); order.push(key) }
      map.get(key)!.push(m)
    }
    return order.map((k) => ({ series: k, matches: map.get(k)! }))
  })()

  const TABS: { key: typeof tab; label: string }[] = [
    { key: 'featured', label: 'Featured' },
    { key: 'live', label: 'Live' },
    { key: 'series', label: 'Series' },
  ]

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <AppHeader
        title="LiveLine Guru"
        subtitle="Live cricket line"
        right={matchCount > 0 ? (
          <View style={styles.pill}><Text style={styles.pillT}>{live.length}</Text></View>
        ) : undefined}
      />

      <View style={styles.slider}>
        {TABS.map((t) => (
          <Pressable key={t.key} onPress={() => setTab(t.key)} style={[styles.slideBtn, tab === t.key && styles.slideBtnOn]}>
            <Text style={[styles.slideTxt, tab === t.key && styles.slideTxtOn]}>{t.label}</Text>
          </Pressable>
        ))}
      </View>

      {showSkeleton ? (
        <View style={{ paddingTop: 8 }}>
          <MatchCardSkeleton />
          <MatchCardSkeleton />
          <MatchCardSkeleton />
        </View>
      ) : (
        <ScrollView
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => load({ pull: true })} tintColor={colors.accent} />}
          contentContainerStyle={styles.scroll}
        >
          {stale && notice && <View style={styles.bannerWrap}><StaleBanner message={notice} /></View>}

          {matchCount === 0 && !loading && (
            <FeedPausedCard onRetry={() => load({ pull: true })} />
          )}

          {tab === 'featured' && (
            <>
              {featured && renderSection('Featured', [featured])}
              {renderSection('Live now', live.filter((m) => m.id !== featured?.id))}
              {renderSection('Up next', upcoming.slice(0, 4))}
            </>
          )}

          {tab === 'live' && (
            <>
              {renderSection('Live now', live)}
              {renderSection('Recent results', recent.slice(0, 8))}
            </>
          )}

          {tab === 'series' && (
            seriesGroups.length > 0 ? seriesGroups.map((g) => renderSection(g.series, g.matches)) : (
              <Text style={styles.sectionEmpty}>No series to show right now</Text>
            )
          )}

          {matchCount === 0 && !loading && (
            <View style={styles.hintBox}>
              <Text style={styles.hintTitle}>Tip</Text>
              <Text style={styles.hintBody}>Star matches to keep them on this screen. Pull down to refresh.</Text>
              <Pressable onPress={() => navigation.getParent()?.navigate('Upcoming' as never)} style={styles.hintLink}>
                <Text style={styles.hintLinkText}>Browse fixtures →</Text>
              </Pressable>
            </View>
          )}
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
  slider: { flexDirection: 'row', gap: 6, paddingHorizontal: 12, paddingVertical: 10, backgroundColor: colors.bg },
  slideBtn: { flex: 1, alignItems: 'center', paddingVertical: 9, borderRadius: 999, backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border },
  slideBtnOn: { backgroundColor: colors.header, borderColor: colors.header },
  slideTxt: { fontSize: 13, fontWeight: '800', color: colors.textMuted },
  slideTxtOn: { color: '#fff' },
  bannerWrap: { marginBottom: 4 },
  section: { marginTop: 8 },
  sectionTitle: { fontSize: 11, fontWeight: '800', color: colors.textDim, letterSpacing: 1, marginLeft: 16, marginBottom: 6, marginTop: 8 },
  sectionEmpty: { color: colors.textDim, textAlign: 'center', marginVertical: 16, fontSize: 13, paddingHorizontal: 24 },
  hintBox: { margin: 16, padding: 16, backgroundColor: colors.card, borderRadius: 10, borderWidth: 1, borderColor: colors.border },
  hintTitle: { fontSize: 14, fontWeight: '800', color: colors.text, marginBottom: 8 },
  hintBody: { fontSize: 13, color: colors.textMuted, lineHeight: 20 },
  hintLink: { marginTop: 12 },
  hintLinkText: { fontSize: 14, fontWeight: '700', color: colors.header },
})
