import { useCallback, useEffect, useRef, useState } from 'react'
import {
  ActivityIndicator, Pressable, RefreshControl, ScrollView, StyleSheet, Text, View,
} from 'react-native'
import { useNavigation, useRoute } from '@react-navigation/native'
import type { RouteProp } from '@react-navigation/native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { fetchMatchBbb, fetchMatchScore } from '../lib/api'
import { LiveBadge } from '../components/LiveBadge'
import { LiveLinePanel } from '../components/LiveLinePanel'
import { HistoryPanel } from '../components/panels/HistoryPanel'
import { RatesPanel } from '../components/panels/RatesPanel'
import { SessionPanel } from '../components/panels/SessionPanel'
import { SquadPanel } from '../components/panels/SquadPanel'
import { TablePanel } from '../components/panels/TablePanel'
import type { BbbBall } from '../types/extras'
import type { RootStackParamList } from '../types/match'
import type { InningScorecard, ScorecardData } from '../types/scorecard'
import { colors } from '../theme/colors'
import { formatScore, formatSr } from '../theme/matchUtils'

type Route = RouteProp<RootStackParamList, 'Scoreboard'>
type Tab = 'line' | 'session' | 'rates' | 'scorecard' | 'history' | 'squad' | 'table' | 'info'

const TABS: { key: Tab; label: string }[] = [
  { key: 'line', label: 'Live Line' },
  { key: 'session', label: 'Session' },
  { key: 'rates', label: 'Rates' },
  { key: 'scorecard', label: 'Scorecard' },
  { key: 'history', label: 'History' },
  { key: 'squad', label: 'Squad' },
  { key: 'table', label: 'Table' },
  { key: 'info', label: 'Info' },
]

const TAB_FADE_STEPS = [0.04, 0.12, 0.28, 0.5, 0.78, 0.95]

function TabBar({ active, onChange }: { active: Tab; onChange: (k: Tab) => void }) {
  return (
    <View style={styles.tabBarWrap}>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.tabBar} contentContainerStyle={styles.tabBarContent}>
        {TABS.map((t) => (
          <Pressable key={t.key} onPress={() => onChange(t.key)} style={[styles.tabBtn, active === t.key && styles.tabBtnActive]}>
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
        <Text style={styles.heroTeamName}>{data.teamInfo?.[0]?.shortname ?? t0}</Text>
        <Text style={styles.heroScore}>{s0 ? formatScore(s0) : '—'}</Text>
      </View>
      <Text style={styles.heroVs}>v</Text>
      <View style={[styles.heroTeam, { alignItems: 'flex-end' }]}>
        <Text style={styles.heroTeamName}>{data.teamInfo?.[1]?.shortname ?? t1}</Text>
        <Text style={styles.heroScore}>{s1 ? formatScore(s1) : '—'}</Text>
      </View>
    </View>
  )
}

export function ScoreboardScreen() {
  const navigation = useNavigation()
  const { matchId, matchName, seriesId, matchType } = useRoute<Route>().params
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [data, setData] = useState<ScorecardData | null>(null)
  const [bbb, setBbb] = useState<BbbBall[]>([])
  const [tab, setTab] = useState<Tab>('line')
  const [inningIdx, setInningIdx] = useState(0)
  const lastFetch = useRef(Date.now())
  const [updatedAgo, setUpdatedAgo] = useState(0)

  const load = useCallback(async (opts?: { silent?: boolean }) => {
    const silent = opts?.silent ?? false
    if (silent) setRefreshing(true)
    else setLoading(true)
    setError(null)
    try {
      const [scoreRes, bbbRes] = await Promise.all([
        fetchMatchScore(matchId),
        fetchMatchBbb(matchId).catch(() => ({ success: true, data: [] as BbbBall[] })),
      ])
      if (!scoreRes.success) throw new Error(scoreRes.error ?? 'API error')
      setData(scoreRes.data)
      if (bbbRes.success && Array.isArray(bbbRes.data)) setBbb(bbbRes.data)
      lastFetch.current = Date.now()
      setUpdatedAgo(0)
    } catch (e: any) {
      setError(e.message ?? 'Failed to load scorecard')
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [matchId])

  useEffect(() => {
    load({ silent: false })
    const poll = setInterval(() => load({ silent: true }), 12_000)
    const clock = setInterval(() => setUpdatedAgo(Math.floor((Date.now() - lastFetch.current) / 1000)), 1000)
    return () => { clearInterval(poll); clearInterval(clock) }
  }, [matchId])

  const innings = data?.scorecard ?? []
  const activeInning = innings[inningIdx]

  return (
    <View style={styles.container}>
      <SafeAreaView edges={['top']} style={styles.safeTop}>
        <View style={styles.nav}>
          <Pressable onPress={() => navigation.goBack()} style={styles.backBtn}><Text style={styles.backText}>← Back</Text></Pressable>
          <View style={styles.navRight}>
            <View style={styles.fmtPill}><Text style={styles.fmtPillText}>{data?.matchType?.toUpperCase() ?? matchType?.toUpperCase() ?? 'MATCH'}</Text></View>
            <LiveBadge ended={data?.matchEnded} started={data?.matchStarted} />
          </View>
        </View>
        <Text style={styles.matchTitle} numberOfLines={2}>{matchName}</Text>
      </SafeAreaView>

      {loading && !data ? (
        <ActivityIndicator color={colors.accent} style={styles.loader} />
      ) : error && !data ? (
        <View style={styles.center}>
          <Text style={styles.error}>{error}</Text>
          <Pressable onPress={() => load({ silent: false })} style={styles.retryBtn}><Text style={styles.retryText}>Retry</Text></Pressable>
        </View>
      ) : data ? (
        <ScrollView
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => load({ silent: true })} tintColor={colors.accent} />}
          stickyHeaderIndices={[2]}
        >
          <ScoreHero data={data} />
          <TabBar active={tab} onChange={setTab} />
          <View style={styles.body}>
            {tab === 'line' && <LiveLinePanel data={data} updatedAgo={updatedAgo} bbb={bbb} />}
            {tab === 'session' && <SessionPanel data={data} />}
            {tab === 'rates' && <RatesPanel data={data} />}
            {tab === 'history' && <HistoryPanel matchId={matchId} />}
            {tab === 'squad' && <SquadPanel matchId={matchId} />}
            {tab === 'table' && <TablePanel seriesId={seriesId} />}
            {tab === 'info' && (
              <View style={styles.infoCard}>
                <InfoRow label="Venue" value={data.venue} />
                <InfoRow label="Date" value={data.date} />
                {data.tossWinner && <InfoRow label="Toss" value={`${data.tossWinner} chose to ${data.tossChoice}`} />}
                <InfoRow label="Format" value={data.matchType?.toUpperCase() ?? '—'} />
                <InfoRow label="Status" value={data.status} />
              </View>
            )}
            {tab === 'scorecard' && (
              innings.length ? (
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
            )}
          </View>
        </ScrollView>
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
  fmtPill: { backgroundColor: 'rgba(255,255,255,0.2)', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 4 },
  fmtPillText: { color: '#fff', fontSize: 10, fontWeight: '800' },
  backBtn: { paddingVertical: 4 },
  backText: { fontSize: 16, color: '#fff', fontWeight: '600' },
  matchTitle: { fontSize: 15, fontWeight: '700', color: '#fff', paddingHorizontal: 16, paddingBottom: 12 },
  hero: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: colors.card, paddingHorizontal: 20, paddingVertical: 16, borderBottomWidth: 1, borderBottomColor: colors.border },
  heroTeam: { flex: 1 },
  heroTeamName: { fontSize: 13, fontWeight: '600', color: colors.textMuted },
  heroScore: { fontSize: 26, fontWeight: '900', color: colors.score, marginTop: 4 },
  heroVs: { fontSize: 14, color: colors.textDim, fontWeight: '600', marginHorizontal: 12 },
  tabBarWrap: { position: 'relative', backgroundColor: colors.card, borderBottomWidth: 1, borderBottomColor: colors.border },
  tabBar: { backgroundColor: colors.card },
  tabBarContent: { paddingRight: 28 },
  tabFade: { position: 'absolute', right: 0, top: 0, bottom: 0, width: 32, flexDirection: 'row' },
  tabFadeStep: { flex: 1 },
  tabBtn: { paddingHorizontal: 14, paddingVertical: 12, borderBottomWidth: 3, borderBottomColor: 'transparent' },
  tabBtnActive: { borderBottomColor: colors.header },
  tabText: { fontSize: 12, fontWeight: '600', color: colors.textDim },
  tabTextActive: { color: colors.header, fontWeight: '800' },
  body: { padding: 12, paddingBottom: 40 },
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
  extrasRow: { padding: 12, backgroundColor: colors.surfaceAlt },
  extrasText: { fontSize: 12, color: colors.textMuted, fontWeight: '600' },
  totalsRow: { padding: 12, backgroundColor: colors.surfaceAlt },
  totalsText: { fontSize: 14, fontWeight: '700', color: colors.score },
  infoCard: { backgroundColor: colors.card, borderRadius: 6, overflow: 'hidden', borderWidth: 1, borderColor: colors.border },
  infoRow: { flexDirection: 'row', paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: colors.border },
  infoLabel: { width: 80, fontSize: 12, fontWeight: '700', color: colors.textMuted },
  infoValue: { flex: 1, fontSize: 13, color: colors.text },
  noData: { color: colors.textDim, textAlign: 'center', marginTop: 32 },
  loader: { marginTop: 48 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24 },
  error: { color: colors.live, fontSize: 14, textAlign: 'center' },
  retryBtn: { marginTop: 16, backgroundColor: colors.header, paddingHorizontal: 20, paddingVertical: 10, borderRadius: 6 },
  retryText: { color: '#fff', fontWeight: '600' },
})
