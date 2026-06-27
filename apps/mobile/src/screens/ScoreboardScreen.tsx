import { useCallback, useEffect, useRef, useState } from 'react'
import {
  ActivityIndicator, Pressable, RefreshControl, ScrollView, Share, StyleSheet, Text, View,
} from 'react-native'
import { StackActions, useNavigation, useRoute } from '@react-navigation/native'
import type { RouteProp } from '@react-navigation/native'
import * as Haptics from 'expo-haptics'
import PagerView from 'react-native-pager-view'
import { SafeAreaView } from 'react-native-safe-area-context'
import { fetchLiveMatches, fetchMatchBbb, fetchMatchScore } from '../lib/api'
import { fallOfWickets } from '../lib/partnerships'
import { LiveBadge } from '../components/LiveBadge'
import { StaleBanner } from '../components/StaleBanner'
import { staleNotice } from '../lib/cacheTime'
import { loadScoreCache, saveScoreCache } from '../lib/matchCache'
import { LiveLinePanel } from '../components/LiveLinePanel'
import { MatchCardSkeleton } from '../components/MatchCardSkeleton'
import { TeamAvatar } from '../components/TeamAvatar'
import { RatesPanel } from '../components/panels/RatesPanel'
import { SessionPanel } from '../components/panels/SessionPanel'
import { SquadPanel } from '../components/panels/SquadPanel'
import type { BbbBall } from '../types/extras'
import type { Match, RootStackParamList } from '../types/match'
import type { InningScorecard, ScorecardData } from '../types/scorecard'
import { colors } from '../theme/colors'
import { formatScore, formatSr } from '../theme/matchUtils'

type Route = RouteProp<RootStackParamList, 'Scoreboard'>
type Tab = 'line' | 'session' | 'rates' | 'scorecard' | 'squad' | 'info'

const TABS: { key: Tab; label: string }[] = [
  { key: 'line', label: 'Live Line' },
  { key: 'session', label: 'Session' },
  { key: 'rates', label: 'Rates' },
  { key: 'scorecard', label: 'Scorecard' },
  { key: 'squad', label: 'Squad' },
  { key: 'info', label: 'Info' },
]

const TAB_FADE_STEPS = [0.04, 0.12, 0.28, 0.5, 0.78, 0.95]

function TabBar({
  active, onChange, scrollRef, onTabLayout,
}: {
  active: Tab
  onChange: (k: Tab) => void
  scrollRef: React.RefObject<ScrollView | null>
  onTabLayout: (index: number, x: number, width: number) => void
}) {
  return (
    <View style={styles.tabBarWrap}>
      <ScrollView
        ref={scrollRef}
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.tabBar}
        contentContainerStyle={styles.tabBarContent}
      >
        {TABS.map((t, i) => (
          <Pressable
            key={t.key}
            onPress={() => onChange(t.key)}
            onLayout={(e) => onTabLayout(i, e.nativeEvent.layout.x, e.nativeEvent.layout.width)}
            style={[styles.tabBtn, active === t.key && styles.tabBtnActive]}
            accessibilityRole="tab"
            accessibilityState={{ selected: active === t.key }}
            accessibilityLabel={`${t.label} tab`}
          >
            <Text style={[styles.tabText, active === t.key && styles.tabTextActive]}>{t.label}</Text>
          </Pressable>
        ))}
      </ScrollView>
      <View pointerEvents="none" style={styles.tabFade}>
        {TAB_FADE_STEPS.map((opacity, i) => (
          <View key={i} style={[styles.tabFadeStep, { opacity, backgroundColor: colors.card }]} />
        ))}
      </View>
    </View>
  )
}

function BattingTable({ inning }: { inning: InningScorecard }) {
  const fow = fallOfWickets(inning)
  return (
    <View style={styles.table}>
      <View style={styles.tHead}>
        <Text style={[styles.th, { flex: 3 }]}>Batsman</Text>
        <Text style={styles.th}>R</Text><Text style={styles.th}>B</Text>
        <Text style={styles.th}>4s</Text><Text style={styles.th}>6s</Text><Text style={styles.th}>SR</Text>
      </View>
      {inning.batting.map((row, i) => {
        const onStrike = row['dismissal-text'] === 'batting'
        return (
          <View key={i} style={[styles.tRow, onStrike && styles.strikerRow]}>
            <View style={{ flex: 3 }}>
              <Text style={[styles.batsmanName, onStrike && styles.strikerName]}>{row.batsman.name}{onStrike ? ' *' : ''}</Text>
              <Text style={styles.dismissal}>{row['dismissal-text']}</Text>
            </View>
            <Text style={[styles.td, onStrike && styles.strikerStat]}>{row.r}</Text>
            <Text style={styles.td}>{row.b}</Text>
            <Text style={styles.td}>{row['4s']}</Text>
            <Text style={styles.td}>{row['6s']}</Text>
            <Text style={styles.td}>{formatSr(row.sr, row.b)}</Text>
          </View>
        )
      })}
      {fow.length > 0 && (
        <View style={styles.fowBox}>
          <Text style={styles.fowLabel}>FALL OF WICKETS</Text>
          {fow.map((w) => (
            <Text key={w.n} style={styles.fowLine}>{w.n}. {w.score} — {w.player} ({w.dismissal})</Text>
          ))}
        </View>
      )}
      {inning.extras && (
        <View style={styles.extrasRow}>
          <Text style={styles.extrasText}>Extras {inning.extras.t} (b {inning.extras.b ?? 0}, lb {inning.extras.lb ?? 0}, w {inning.extras.w ?? 0}, nb {inning.extras.nb ?? 0})</Text>
        </View>
      )}
      {inning.totals && (
        <View style={styles.totalsRow}>
          <Text style={styles.totalsText}>Total: {inning.totals.r}/{inning.totals.w} ({inning.totals.o} ov)</Text>
        </View>
      )}
    </View>
  )
}

function BowlingTable({ inning }: { inning: InningScorecard }) {
  if (!inning.bowling?.length) return null
  return (
    <View style={[styles.table, { marginTop: 12 }]}>
      <Text style={styles.sectionLabel}>Bowling</Text>
      <View style={styles.tHead}>
        <Text style={[styles.th, { flex: 3 }]}>Bowler</Text>
        <Text style={styles.th}>O</Text><Text style={styles.th}>M</Text><Text style={styles.th}>R</Text>
        <Text style={styles.th}>W</Text><Text style={styles.th}>Econ</Text>
      </View>
      {inning.bowling.map((row, i) => (
        <View key={i} style={[styles.tRow, i % 2 === 0 && styles.rowAlt]}>
          <Text style={[styles.td, { flex: 3, textAlign: 'left', fontWeight: '600' }]}>{row.bowler.name}</Text>
          <Text style={styles.td}>{row.o}</Text><Text style={styles.td}>{row.m}</Text>
          <Text style={styles.td}>{row.r}</Text><Text style={styles.td}>{row.w}</Text>
          <Text style={styles.td}>{row.eco.toFixed(1)}</Text>
        </View>
      ))}
    </View>
  )
}

function ScoreHero({ data }: { data: ScorecardData }) {
  const t0 = data.teams[0]; const t1 = data.teams[1]
  const s0 = data.score?.find((s) => s.inning.toLowerCase().includes(t0?.toLowerCase().split(' ')[0] ?? ''))
  const s1 = data.score?.find((s) => s.inning.toLowerCase().includes(t1?.toLowerCase().split(' ')[0] ?? ''))
  return (
    <View style={styles.hero}>
      <View style={styles.heroTeam}>
        <TeamAvatar shortname={data.teamInfo?.[0]?.shortname ?? t0} logo={data.teamInfo?.[0]?.img} size={36} />
        <Text style={styles.heroTeamName}>{data.teamInfo?.[0]?.shortname ?? t0}</Text>
        <Text style={styles.heroScore}>{s0 ? formatScore(s0) : '—'}</Text>
      </View>
      <Text style={styles.heroVs}>v</Text>
      <View style={[styles.heroTeam, { alignItems: 'flex-end' }]}>
        <TeamAvatar shortname={data.teamInfo?.[1]?.shortname ?? t1} logo={data.teamInfo?.[1]?.img} size={36} />
        <Text style={styles.heroTeamName}>{data.teamInfo?.[1]?.shortname ?? t1}</Text>
        <Text style={styles.heroScore}>{s1 ? formatScore(s1) : '—'}</Text>
      </View>
    </View>
  )
}

export function ScoreboardScreen() {
  const navigation = useNavigation()
  const route = useRoute<Route>()
  const { matchId, seriesId, matchType } = route.params
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [stale, setStale] = useState(false)
  const [notice, setNotice] = useState<string | null>(null)
  const [data, setData] = useState<ScorecardData | null>(null)
  const [bbb, setBbb] = useState<BbbBall[]>([])
  const [otherLive, setOtherLive] = useState<Match[]>([])
  const [tab, setTab] = useState<Tab>('line')
  const [inningIdx, setInningIdx] = useState(0)
  const pagerRef = useRef<PagerView>(null)
  const tabScrollRef = useRef<ScrollView>(null)
  const tabLayouts = useRef<Record<number, { x: number; width: number }>>({})
  const lastHapticPage = useRef(0)

  const headerTitle = data
    ? `${data.teamInfo?.[0]?.shortname ?? data.teams[0]} vs ${data.teamInfo?.[1]?.shortname ?? data.teams[1]}`
    : route.params.matchName

  const load = useCallback(async (opts?: { silent?: boolean; pull?: boolean }) => {
    const silent = opts?.silent ?? false
    const pull = opts?.pull ?? false
    if (pull) setRefreshing(true)
    else if (!silent && !data) setLoading(true)

    const [scoreRes, bbbRes, liveRes] = await Promise.all([
      fetchMatchScore(matchId),
      fetchMatchBbb(matchId),
      fetchLiveMatches(),
    ])

    if (scoreRes.success && scoreRes.data) {
      const nextBbb = bbbRes.success && Array.isArray(bbbRes.data) && bbbRes.data.length
        ? bbbRes.data
        : bbb.length ? bbb : (bbbRes.data ?? [])
      const nextData = scoreRes.data.score?.length || scoreRes.data.scorecard?.length
        ? scoreRes.data
        : (data ?? scoreRes.data)
      setData(nextData)
      setBbb(nextBbb)
      const isStale = !!(scoreRes.stale || bbbRes.stale)
      setStale(isStale)
      setNotice(isStale ? staleNotice(scoreRes.cachedAt) : null)
      setError(null)
      await saveScoreCache(matchId, nextData, nextBbb)
    } else {
      const cached = await loadScoreCache(matchId)
      if (cached) {
        setData(cached.data)
        setBbb(cached.bbb)
        setStale(true)
        setNotice(staleNotice(cached.savedAt))
        setError(null)
      } else if (data) {
        setStale(true)
        setNotice(staleNotice())
      } else {
        setError('Scorecard not available')
      }
    }

    if (liveRes.success) {
      setOtherLive(liveRes.data.filter((m) => m.id !== matchId && m.matchStarted && !m.matchEnded))
    }

    setLoading(false)
    setRefreshing(false)
  }, [matchId, data, bbb])

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      const cached = await loadScoreCache(matchId)
      if (cancelled) return
      if (cached) {
        setData(cached.data)
        setBbb(cached.bbb)
        setStale(true)
        setNotice(staleNotice(cached.savedAt))
        setLoading(false)
        await load({ silent: true })
      } else {
        await load({ silent: false })
      }
    })()
    return () => { cancelled = true }
  }, [matchId]) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    const poll = setInterval(() => load({ silent: true }), stale ? 45_000 : 12_000)
    return () => clearInterval(poll)
  }, [load, stale])

  const scrollTabIntoView = useCallback((index: number) => {
    const layout = tabLayouts.current[index]
    if (!layout || !tabScrollRef.current) return
    tabScrollRef.current.scrollTo({ x: Math.max(0, layout.x - 24), animated: true })
  }, [])

  const onTabChange = (k: Tab) => {
    const idx = TABS.findIndex((t) => t.key === k)
    if (idx < 0) return
    setTab(k)
    pagerRef.current?.setPage(idx)
    scrollTabIntoView(idx)
    void Haptics.selectionAsync()
  }

  const onPageSelected = (index: number) => {
    setTab(TABS[index]?.key ?? 'line')
    scrollTabIntoView(index)
    if (lastHapticPage.current !== index) {
      lastHapticPage.current = index
      void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
    }
  }

  const onTabLayout = useCallback((index: number, x: number, width: number) => {
    tabLayouts.current[index] = { x, width }
  }, [])

  useEffect(() => {
    const idx = TABS.findIndex((t) => t.key === tab)
    if (idx >= 0) scrollTabIntoView(idx)
  }, [tab, scrollTabIntoView])

  const shareScore = async () => {
    if (!data) return
    const line = data.score?.map((s) => `${s.inning}: ${s.r}/${s.w}`).join(' · ') ?? data.status
    await Share.share({ message: `🏏 ${data.teams.join(' vs ')}\n${line}\n${data.status}\n· CricketFast` })
  }

  const switchMatch = (m: Match) => {
    navigation.dispatch(StackActions.replace('Scoreboard', {
      matchId: m.id,
      matchName: m.teams.join(' vs '),
      seriesId: m.series_id,
      matchType: m.matchType,
    }))
  }

  const innings = data?.scorecard ?? []
  const activeInning = innings[inningIdx]

  const renderPage = (key: Tab) => {
    if (!data) return null
    switch (key) {
      case 'line': return <LiveLinePanel data={data} bbb={bbb} otherLive={otherLive} onSwitchMatch={switchMatch} />
      case 'session': return <SessionPanel data={data} bbb={bbb} />
      case 'rates': return <RatesPanel data={data} />
      case 'squad': return <SquadPanel matchId={matchId} />
      case 'info': return (
        <View style={styles.infoCard}>
          <InfoRow label="Venue" value={data.venue} />
          <InfoRow label="Date" value={data.date} />
          {data.tossWinner && <InfoRow label="Toss" value={`${data.tossWinner} chose to ${data.tossChoice}`} />}
          <InfoRow label="Format" value={data.matchType?.toUpperCase() ?? '—'} />
          <InfoRow label="Status" value={data.status} />
        </View>
      )
      case 'scorecard': return innings.length ? (
        <>
          {innings.length > 1 && (
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 10 }}>
              {innings.map((inn, i) => (
                <Pressable key={i} onPress={() => setInningIdx(i)} style={[styles.inningTab, inningIdx === i && styles.inningTabActive]}>
                  <Text style={[styles.inningTabText, inningIdx === i && styles.inningTabTextActive]}>{inn.inning}</Text>
                </Pressable>
              ))}
            </ScrollView>
          )}
          {activeInning && <><BattingTable inning={activeInning} /><BowlingTable inning={activeInning} /></>}
        </>
      ) : <Text style={styles.noData}>Scorecard not available yet</Text>
      default: return null
    }
  }

  return (
    <View style={styles.container}>
      <SafeAreaView edges={['top']} style={styles.safeTop}>
        <View style={styles.nav}>
          <Pressable onPress={() => navigation.goBack()} style={styles.backBtn} accessibilityRole="button">
            <Text style={styles.backText}>← Back</Text>
          </Pressable>
          <View style={styles.navRight}>
            {data && (
              <Pressable onPress={shareScore} style={styles.shareBtn} accessibilityRole="button" accessibilityLabel="Share score">
                <Text style={styles.shareText}>Share</Text>
              </Pressable>
            )}
            <View style={styles.fmtPill}><Text style={styles.fmtPillText}>{data?.matchType?.toUpperCase() ?? matchType?.toUpperCase() ?? 'MATCH'}</Text></View>
            <LiveBadge ended={data?.matchEnded} started={data?.matchStarted} />
          </View>
        </View>
        <Text style={styles.matchTitle} numberOfLines={1}>{headerTitle}</Text>
      </SafeAreaView>

      {stale && notice && data && <StaleBanner message={notice} />}

      {loading && !data ? (
        <View style={{ padding: 12 }}><MatchCardSkeleton /><ActivityIndicator color={colors.accent} style={{ marginTop: 16 }} /></View>
      ) : error && !data ? (
        <View style={styles.center}>
          <Text style={styles.error}>{error}</Text>
          <Pressable onPress={() => load({ silent: false })} style={styles.retryBtn}><Text style={styles.retryText}>Retry</Text></Pressable>
        </View>
      ) : data ? (
        <View style={styles.content}>
          <ScoreHero data={data} />
          <TabBar active={tab} onChange={onTabChange} scrollRef={tabScrollRef} onTabLayout={onTabLayout} />
          <PagerView
            ref={pagerRef}
            style={styles.pager}
            initialPage={0}
            scrollEnabled
            overdrag
            offscreenPageLimit={2}
            onPageSelected={(e) => onPageSelected(e.nativeEvent.position)}
          >
            {TABS.map((t) => (
              <View key={t.key} style={styles.page} collapsable={false}>
                <ScrollView
                  style={styles.pageScroll}
                  contentContainerStyle={styles.body}
                  nestedScrollEnabled
                  showsVerticalScrollIndicator
                  refreshControl={(
                    <RefreshControl
                      refreshing={refreshing}
                      onRefresh={() => load({ pull: true })}
                      tintColor={colors.accent}
                    />
                  )}
                >
                  {renderPage(t.key)}
                </ScrollView>
              </View>
            ))}
          </PagerView>
        </View>
      ) : null}
    </View>
  )
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.infoRow}>
      <Text style={styles.infoLabel}>{label}</Text>
      <Text style={styles.infoValue}>{value}</Text>
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  safeTop: { backgroundColor: colors.header },
  nav: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 16, paddingTop: 4 },
  navRight: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  shareBtn: { paddingHorizontal: 8, paddingVertical: 4 },
  shareText: { color: '#fff', fontWeight: '700', fontSize: 13 },
  fmtPill: { backgroundColor: 'rgba(255,255,255,0.2)', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 4 },
  fmtPillText: { color: '#fff', fontSize: 10, fontWeight: '800' },
  backBtn: { paddingVertical: 4, minHeight: 44, justifyContent: 'center' },
  backText: { fontSize: 16, color: '#fff', fontWeight: '600' },
  matchTitle: { fontSize: 17, fontWeight: '800', color: '#fff', paddingHorizontal: 16, paddingBottom: 12 },
  hero: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: colors.card, paddingHorizontal: 20, paddingVertical: 16, borderBottomWidth: 1, borderBottomColor: colors.border },
  heroTeam: { flex: 1, alignItems: 'flex-start', gap: 4 },
  heroTeamName: { fontSize: 13, fontWeight: '600', color: colors.textMuted },
  heroScore: { fontSize: 32, fontWeight: '900', color: colors.score },
  heroVs: { fontSize: 14, color: colors.textDim, fontWeight: '600', marginHorizontal: 12 },
  tabBarWrap: { position: 'relative', backgroundColor: colors.card, borderBottomWidth: 1, borderBottomColor: colors.border },
  tabBar: { backgroundColor: colors.card },
  tabBarContent: { paddingRight: 28 },
  tabFade: { position: 'absolute', right: 0, top: 0, bottom: 0, width: 32, flexDirection: 'row' },
  tabFadeStep: { flex: 1 },
  tabBtn: { paddingHorizontal: 14, paddingVertical: 14, minHeight: 44, borderBottomWidth: 3, borderBottomColor: 'transparent', justifyContent: 'center' },
  tabBtnActive: { borderBottomColor: colors.header },
  tabText: { fontSize: 12, fontWeight: '600', color: colors.textDim },
  tabTextActive: { color: colors.header, fontWeight: '800' },
  content: { flex: 1 },
  pager: { flex: 1 },
  page: { flex: 1 },
  pageScroll: { flex: 1 },
  body: { padding: 12, paddingBottom: 40, flexGrow: 1 },
  inningTab: { paddingHorizontal: 14, paddingVertical: 8, marginRight: 8, borderRadius: 20, backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border },
  inningTabActive: { backgroundColor: colors.header, borderColor: colors.header },
  inningTabText: { fontSize: 12, fontWeight: '600', color: colors.textMuted },
  inningTabTextActive: { color: '#fff' },
  table: { backgroundColor: colors.card, borderRadius: 6, overflow: 'hidden', borderWidth: 1, borderColor: colors.border },
  sectionLabel: { fontSize: 12, fontWeight: '700', color: colors.textMuted, padding: 12, paddingBottom: 4 },
  tHead: { flexDirection: 'row', backgroundColor: colors.surfaceAlt, paddingVertical: 8, paddingHorizontal: 12 },
  th: { flex: 1, fontSize: 10, fontWeight: '700', color: colors.textDim, textAlign: 'center' },
  tRow: { flexDirection: 'row', paddingVertical: 10, paddingHorizontal: 12, alignItems: 'center', borderBottomWidth: 1, borderBottomColor: colors.border },
  rowAlt: { backgroundColor: colors.rowAlt },
  strikerRow: { backgroundColor: colors.striker },
  batsmanName: { fontSize: 14, fontWeight: '600', color: colors.text },
  strikerName: { color: colors.score, fontWeight: '800' },
  strikerStat: { color: colors.score, fontWeight: '800' },
  dismissal: { fontSize: 11, color: colors.textDim, marginTop: 2 },
  td: { flex: 1, fontSize: 13, color: colors.text, textAlign: 'center' },
  fowBox: { padding: 12, backgroundColor: colors.surfaceAlt, borderTopWidth: 1, borderTopColor: colors.border },
  fowLabel: { fontSize: 10, fontWeight: '800', color: colors.textDim, marginBottom: 6 },
  fowLine: { fontSize: 11, color: colors.textMuted, marginBottom: 4 },
  extrasRow: { padding: 12, backgroundColor: colors.surfaceAlt },
  extrasText: { fontSize: 12, color: colors.textMuted, fontWeight: '600' },
  totalsRow: { padding: 12, backgroundColor: colors.surfaceAlt },
  totalsText: { fontSize: 14, fontWeight: '700', color: colors.score },
  infoCard: { backgroundColor: colors.card, borderRadius: 6, overflow: 'hidden', borderWidth: 1, borderColor: colors.border },
  infoRow: { flexDirection: 'row', paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: colors.border },
  infoLabel: { width: 80, fontSize: 12, fontWeight: '700', color: colors.textMuted },
  infoValue: { flex: 1, fontSize: 13, color: colors.text },
  noData: { color: colors.textDim, textAlign: 'center', marginTop: 32 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24 },
  error: { color: colors.live, fontSize: 14, textAlign: 'center' },
  retryBtn: { marginTop: 16, backgroundColor: colors.header, paddingHorizontal: 20, paddingVertical: 10, borderRadius: 6 },
  retryText: { color: '#fff', fontWeight: '600' },
})
