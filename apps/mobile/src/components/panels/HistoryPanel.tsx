import { useEffect, useState } from 'react'
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native'
import { useNavigation } from '@react-navigation/native'
import type { NativeStackNavigationProp } from '@react-navigation/native-stack'
import { fetchMatchHistory } from '../../lib/api'
import type { Match, RootStackParamList } from '../../types/match'
import { colors } from '../../theme/colors'
import { formatScore, formatTimeShort } from '../../theme/matchUtils'

type Nav = NativeStackNavigationProp<RootStackParamList>

function teamWinsInH2H(matches: Match[], team: string): number {
  const key = team.toLowerCase().split(' ')[0]
  return matches.filter((m) => {
    const s = m.status.toLowerCase()
    return s.includes('won') && (s.includes(key) || m.teams.some((t) => t.toLowerCase().includes(key)))
  }).length
}

export function HistoryPanel({ matchId }: { matchId: string }) {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [h2h, setH2h] = useState<Match[]>([])
  const [t1, setT1] = useState<Match[]>([])
  const [t2, setT2] = useState<Match[]>([])
  const [teams, setTeams] = useState<string[]>([])

  useEffect(() => {
    setLoading(true)
    fetchMatchHistory(matchId)
      .then((res) => {
        if (!res.success) throw new Error(res.error ?? 'Failed')
        setH2h(res.data.headToHead)
        setT1(res.data.team1Recent)
        setT2(res.data.team2Recent)
        setTeams(res.data.teams)
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false))
  }, [matchId])

  if (loading) return <ActivityIndicator color={colors.accent} style={{ marginTop: 24 }} />
  if (error) return <Text style={styles.error}>{error}</Text>

  const w1 = teams[0] ? teamWinsInH2H(h2h, teams[0]) : 0
  const w2 = teams[1] ? teamWinsInH2H(h2h, teams[1]) : 0

  return (
    <View>
      {h2h.length > 0 && teams.length >= 2 && (
        <View style={styles.summary}>
          <Text style={styles.summaryLabel}>HEAD TO HEAD</Text>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryTeam} numberOfLines={1}>{teams[0]}</Text>
            <Text style={styles.summaryScore}>{w1} – {w2}</Text>
            <Text style={[styles.summaryTeam, { textAlign: 'right' }]} numberOfLines={1}>{teams[1]}</Text>
          </View>
          <Text style={styles.summaryMeta}>{h2h.length} recent meeting{h2h.length === 1 ? '' : 's'}</Text>
        </View>
      )}

      <HistorySection title="H2H MATCHES" matches={h2h} empty="No recent H2H matches found" />
      {teams[0] && <HistorySection title={`${teams[0]} — LAST 5`} matches={t1} empty="No recent matches" />}
      {teams[1] && <HistorySection title={`${teams[1]} — LAST 5`} matches={t2} empty="No recent matches" />}
    </View>
  )
}

function HistorySection({ title, matches, empty }: { title: string; matches: Match[]; empty: string }) {
  const navigation = useNavigation<Nav>()

  return (
    <View style={styles.section}>
      <Text style={styles.label}>{title}</Text>
      {matches.length === 0 ? (
        <Text style={styles.empty}>{empty}</Text>
      ) : (
        matches.map((m) => {
          const scoreLine = m.score?.length
            ? m.score.map((s) => formatScore(s)).join(' · ')
            : null
          return (
            <Pressable
              key={m.id}
              style={styles.row}
              onPress={() => navigation.navigate('Scoreboard', {
                matchId: m.id,
                matchName: m.teams.join(' vs '),
                seriesId: m.series_id,
                matchType: m.matchType,
              })}
            >
              <Text style={styles.name} numberOfLines={1}>{m.teams.join(' vs ')}</Text>
              {scoreLine && <Text style={styles.scores}>{scoreLine}</Text>}
              <Text style={styles.status} numberOfLines={2}>{m.status}</Text>
              <Text style={styles.meta}>{formatTimeShort(m.dateTimeGMT)} · {m.venue}</Text>
            </Pressable>
          )
        })
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  summary: { backgroundColor: colors.card, borderRadius: 6, padding: 14, marginBottom: 14, borderWidth: 1, borderColor: colors.border },
  summaryLabel: { fontSize: 10, fontWeight: '800', color: colors.textDim, letterSpacing: 0.8, marginBottom: 10 },
  summaryRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  summaryTeam: { flex: 1, fontSize: 12, fontWeight: '700', color: colors.text },
  summaryScore: { fontSize: 22, fontWeight: '900', color: colors.score },
  summaryMeta: { fontSize: 10, color: colors.textDim, marginTop: 8, textAlign: 'center' },
  section: { marginBottom: 14 },
  label: { fontSize: 10, fontWeight: '800', color: colors.textDim, letterSpacing: 0.8, marginBottom: 8 },
  row: { backgroundColor: colors.card, padding: 12, marginBottom: 6, borderRadius: 4, borderWidth: 1, borderColor: colors.border },
  name: { fontSize: 13, fontWeight: '700', color: colors.text },
  scores: { fontSize: 12, fontWeight: '700', color: colors.score, marginTop: 4 },
  status: { fontSize: 11, color: colors.textMuted, marginTop: 4 },
  meta: { fontSize: 10, color: colors.textDim, marginTop: 6 },
  empty: { fontSize: 12, color: colors.textDim, textAlign: 'center', padding: 16 },
  error: { color: colors.live, textAlign: 'center', marginTop: 24 },
})
