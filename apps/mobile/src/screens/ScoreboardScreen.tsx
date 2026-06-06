import { useCallback, useEffect, useState } from 'react'
import {
  ActivityIndicator,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native'
import { useNavigation, useRoute } from '@react-navigation/native'
import type { RouteProp } from '@react-navigation/native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { fetchMatchScore } from '../lib/api'
import { LiveBadge } from '../components/LiveBadge'
import type { RootStackParamList } from '../types/match'
import type { InningScorecard } from '../types/scorecard'
import { colors } from '../theme/colors'

type Route = RouteProp<RootStackParamList, 'Scoreboard'>

function BattingTable({ inning }: { inning: InningScorecard }) {
  return (
    <View style={styles.table}>
      <View style={styles.tableHeader}>
        <Text style={[styles.th, styles.colBatsman]}>Batsman</Text>
        <Text style={styles.th}>R</Text>
        <Text style={styles.th}>B</Text>
        <Text style={styles.th}>4s</Text>
        <Text style={styles.th}>6s</Text>
        <Text style={styles.th}>SR</Text>
      </View>
      {inning.batting.map((row, i) => (
        <View key={i} style={[styles.tableRow, i % 2 === 0 && styles.rowAlt]}>
          <View style={styles.colBatsman}>
            <Text style={styles.batsmanName}>{row.batsman.name}</Text>
            <Text style={styles.dismissal}>{row['dismissal-text']}</Text>
          </View>
          <Text style={styles.td}>{row.r}</Text>
          <Text style={styles.td}>{row.b}</Text>
          <Text style={styles.td}>{row['4s']}</Text>
          <Text style={styles.td}>{row['6s']}</Text>
          <Text style={styles.td}>{row.sr.toFixed(1)}</Text>
        </View>
      ))}
      {inning.totals && (
        <View style={styles.totalsRow}>
          <Text style={styles.totalsText}>
            Total: {inning.totals.r}/{inning.totals.w} ({inning.totals.o} ov)
          </Text>
        </View>
      )}
    </View>
  )
}

function BowlingTable({ inning }: { inning: InningScorecard }) {
  if (!inning.bowling?.length) return null
  return (
    <View style={[styles.table, styles.bowlTable]}>
      <Text style={styles.sectionLabel}>Bowling</Text>
      <View style={styles.tableHeader}>
        <Text style={[styles.th, styles.colBowler]}>Bowler</Text>
        <Text style={styles.th}>O</Text>
        <Text style={styles.th}>R</Text>
        <Text style={styles.th}>W</Text>
        <Text style={styles.th}>Econ</Text>
      </View>
      {inning.bowling.map((row, i) => (
        <View key={i} style={[styles.tableRow, i % 2 === 0 && styles.rowAlt]}>
          <Text style={[styles.td, styles.colBowler, styles.bowlerName]}>{row.bowler.name}</Text>
          <Text style={styles.td}>{row.o}</Text>
          <Text style={styles.td}>{row.r}</Text>
          <Text style={styles.td}>{row.w}</Text>
          <Text style={styles.td}>{row.eco.toFixed(1)}</Text>
        </View>
      ))}
    </View>
  )
}

export function ScoreboardScreen() {
  const navigation = useNavigation()
  const { matchId, matchName } = useRoute<Route>().params
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [data, setData] = useState<Awaited<ReturnType<typeof fetchMatchScore>>['data'] | null>(null)

  const load = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true)
    else setLoading(true)
    setError(null)
    try {
      const res = await fetchMatchScore(matchId)
      if (!res.success) throw new Error(res.error ?? 'API error')
      setData(res.data)
    } catch (e: any) {
      setError(e.message ?? 'Failed to load scorecard')
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [matchId])

  useEffect(() => {
    load()
    const id = setInterval(() => load(true), 8_000)
    return () => clearInterval(id)
  }, [load])

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.nav}>
        <Pressable onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Text style={styles.backText}>← Back</Text>
        </Pressable>
        <LiveBadge ended={data?.matchEnded} />
      </View>

      {loading && !refreshing ? (
        <ActivityIndicator color={colors.accent} style={styles.loader} />
      ) : error ? (
        <View style={styles.center}>
          <Text style={styles.error}>{error}</Text>
          <Pressable onPress={() => load()} style={styles.retryBtn}>
            <Text style={styles.retryText}>Retry</Text>
          </Pressable>
        </View>
      ) : data ? (
        <ScrollView
          contentContainerStyle={styles.scroll}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={() => load(true)} tintColor={colors.accent} />
          }
        >
          <Text style={styles.matchTitle}>{matchName}</Text>
          <Text style={styles.matchType}>{data.matchType?.toUpperCase()}</Text>
          <Text style={styles.status}>{data.status}</Text>
          <Text style={styles.venue}>{data.venue}</Text>

          {data.tossWinner && (
            <Text style={styles.toss}>
              Toss: {data.tossWinner} chose to {data.tossChoice}
            </Text>
          )}

          {data.score?.map((s, i) => (
            <View key={i} style={styles.scorePill}>
              <Text style={styles.inningLabel}>{s.inning}</Text>
              <Text style={styles.inningScore}>
                {s.r}/{s.w} <Text style={styles.overs}>({s.o} ov)</Text>
              </Text>
            </View>
          ))}

          {data.scorecard?.map((inning, i) => (
            <View key={i} style={styles.inningBlock}>
              <Text style={styles.inningHeader}>{inning.inning}</Text>
              <BattingTable inning={inning} />
              <BowlingTable inning={inning} />
            </View>
          ))}

          {!data.scorecard?.length && (
            <Text style={styles.noData}>Scorecard not available yet</Text>
          )}
        </ScrollView>
      ) : null}
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  nav: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  backBtn: { paddingVertical: 4, paddingRight: 12 },
  backText: { fontSize: 16, color: colors.accent, fontWeight: '600' },
  scroll: { padding: 16, paddingBottom: 40 },
  matchTitle: { fontSize: 20, fontWeight: '800', color: colors.text, lineHeight: 26 },
  matchType: { fontSize: 11, fontWeight: '700', color: colors.blue, marginTop: 6, letterSpacing: 1 },
  status: { fontSize: 15, color: colors.gold, marginTop: 10, lineHeight: 22 },
  venue: { fontSize: 13, color: colors.textDim, marginTop: 6 },
  toss: { fontSize: 13, color: colors.textMuted, marginTop: 8, fontStyle: 'italic' },
  scorePill: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: 14,
    marginTop: 16,
    borderWidth: 1,
    borderColor: colors.border,
  },
  inningLabel: { fontSize: 14, color: colors.textMuted, fontWeight: '500' },
  inningScore: { fontSize: 22, fontWeight: '800', color: colors.accent },
  overs: { fontSize: 14, fontWeight: '500', color: colors.textMuted },
  inningBlock: { marginTop: 24 },
  inningHeader: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 10,
    paddingBottom: 8,
    borderBottomWidth: 2,
    borderBottomColor: colors.accent,
  },
  sectionLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.textMuted,
    marginBottom: 8,
    marginTop: 4,
  },
  table: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: colors.border,
  },
  bowlTable: { marginTop: 12 },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: colors.surfaceRaised,
    paddingVertical: 10,
    paddingHorizontal: 12,
  },
  th: { flex: 1, fontSize: 11, fontWeight: '700', color: colors.textDim, textAlign: 'center' },
  tableRow: { flexDirection: 'row', paddingVertical: 10, paddingHorizontal: 12, alignItems: 'center' },
  rowAlt: { backgroundColor: 'rgba(255,255,255,0.02)' },
  colBatsman: { flex: 3, textAlign: 'left' },
  colBowler: { flex: 3, textAlign: 'left' },
  batsmanName: { fontSize: 14, fontWeight: '600', color: colors.text },
  dismissal: { fontSize: 11, color: colors.textDim, marginTop: 2 },
  bowlerName: { fontWeight: '600' },
  td: { flex: 1, fontSize: 13, color: colors.text, textAlign: 'center' },
  totalsRow: {
    padding: 12,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    backgroundColor: colors.surfaceRaised,
  },
  totalsText: { fontSize: 14, fontWeight: '700', color: colors.accent },
  noData: { color: colors.textDim, textAlign: 'center', marginTop: 32, fontSize: 15 },
  loader: { marginTop: 48 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24 },
  error: { color: '#f87171', fontSize: 15, textAlign: 'center' },
  retryBtn: {
    marginTop: 16,
    backgroundColor: colors.accentDim,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  retryText: { color: colors.accent, fontWeight: '600' },
})
