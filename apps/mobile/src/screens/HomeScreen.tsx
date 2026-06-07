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
import { fetchLiveMatches, fetchRecentMatches, fetchUpcomingMatches } from '../lib/api'
import {
  friendlyLimitMessage,
  hydrateHomeFromFavorites,
  isBlockedError,
  loadHomeCache,
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
  const bootstrapped = useRef(false)

  const applyFeed = useCallback((nextLive: Match[], nextRecent: Match[], nextUpcoming: Match[]) => {
    setLive(nextLive)
    setRecent(nextRecent)
    setUpcoming(nextUpcoming)
  }, [])

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

    const err = l.error ?? r.error ?? u.error
    const anyOk = l.success || r.success || u.success
    const isStale = !!(l.stale || r.stale || u.stale) || !anyOk

    if (anyOk) {
      const prev = await loadHomeCache()
      const nextLive = l.success ? (l.data ?? []) : (prev?.live ?? [])
      const nextRecent = r.success ? (r.data ?? []) : (prev?.recent ?? [])
      const nextUpcoming = u.success ? (u.data ?? []) : (prev?.upcoming ?? [])
      applyFeed(nextLive, nextRecent, nextUpcoming)
      await saveHomeCache(nextLive, nextRecent, nextUpcoming)
      setStale(isStale)
      setNotice(isStale ? friendlyLimitMessage(err) : null)
    } else {
      let cached = await loadHomeCache()
      if (!cached?.live.length && !cached?.recent.length && !cached?.upcoming.length) {
        const fromFav = await hydrateHomeFromFavorites()
        if (fromFav.live.length || fromFav.recent.length || fromFav.upcoming.length) {
          cached = { ...fromFav, savedAt: Date.now() }
        }
      }
      if (cached && (cached.live.length || cached.recent.length || cached.upcoming.length)) {
        applyFeed(cached.live, cached.recent, cached.upcoming)
        setStale(true)
        setNotice(friendlyLimitMessage(err))
      } else {
        setStale(true)
        setNotice(err ?? 'Could not load scores')
      }
    }

    setLoading(false)
    setRefreshing(false)
  }, [applyFeed])

  // Cache-first: show last good feed immediately, then refresh in background
  useEffect(() => {
    if (bootstrapped.current) return
    bootstrapped.current = true
    ;(async () => {
      const cached = await loadHomeCache()
      if (cached && (cached.live.length || cached.recent.length || cached.upcoming.length)) {
        applyFeed(cached.live, cached.recent, cached.upcoming)
        setStale(true)
        setLoading(false)
        await load({ silent: true })
        return
      }
      const fromFav = await hydrateHomeFromFavorites()
      if (fromFav.live.length || fromFav.recent.length || fromFav.upcoming.length) {
        applyFeed(fromFav.live, fromFav.recent, fromFav.upcoming)
        setStale(true)
        setNotice('Showing your saved matches — live feed is paused')
        setLoading(false)
        await load({ silent: true })
        return
      }
      await load({ silent: false })
    })()
  }, [applyFeed, load])

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
          {title === 'Live now' ? 'No live matches in cache' : `Nothing in ${title.toLowerCase()} right now`}
        </Text>
      )}
    </View>
  )

  const matchCount = live.length + recent.length + upcoming.length
  const showSkeleton = loading && !refreshing && matchCount === 0
  const feedPaused = stale && notice && (isBlockedError(notice) || matchCount === 0)

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <AppHeader
        title="CricketFast"
        subtitle="Live cricket line"
        right={matchCount > 0 ? (
          <View style={styles.pill}><Text style={styles.pillT}>{live.length}</Text></View>
        ) : undefined}
      />

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

          {feedPaused && (
            <FeedPausedCard message={notice ?? undefined} onRetry={() => load({ pull: true })} />
          )}

          {renderSection('Live now', live)}
          {renderSection('Recent results', recent.slice(0, 8))}
          {renderSection('Upcoming fixtures', upcoming.slice(0, 8))}

          {matchCount === 0 && !loading && (
            <View style={styles.hintBox}>
              <Text style={styles.hintTitle}>While you wait</Text>
              <Text style={styles.hintBody}>
                Star matches to keep them on this screen even when the live API is blocked.
                Try the Fixtures tab or pull down to refresh.
              </Text>
              <Pressable onPress={() => navigation.getParent()?.navigate('Upcoming' as never)} style={styles.hintLink}>
                <Text style={styles.hintLinkText}>Open Fixtures →</Text>
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
