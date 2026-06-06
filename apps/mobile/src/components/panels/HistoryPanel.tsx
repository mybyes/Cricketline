import { useEffect, useState } from 'react'
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native'
import { fetchMatchHistory } from '../../lib/api'
import type { Match } from '../../types/match'
import { colors } from '../../theme/colors'

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

  return (
    <View>
      <HistorySection title="HEAD TO HEAD" matches={h2h} empty="No recent H2H matches found" />
      {teams[0] && <HistorySection title={`${teams[0]} — RECENT`} matches={t1} empty="No recent matches" />}
      {teams[1] && <HistorySection title={`${teams[1]} — RECENT`} matches={t2} empty="No recent matches" />}
    </View>
  )
}

function HistorySection({ title, matches, empty }: { title: string; matches: Match[]; empty: string }) {
  return (
    <View style={styles.section}>
      <Text style={styles.label}>{title}</Text>
      {matches.length === 0 ? (
        <Text style={styles.empty}>{empty}</Text>
      ) : (
        matches.map((m) => (
          <View key={m.id} style={styles.row}>
            <Text style={styles.name} numberOfLines={1}>{m.teams.join(' vs ')}</Text>
            <Text style={styles.status} numberOfLines={2}>{m.status}</Text>
          </View>
        ))
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  section: { marginBottom: 14 },
  label: { fontSize: 10, fontWeight: '800', color: colors.textDim, letterSpacing: 0.8, marginBottom: 8 },
  row: { backgroundColor: colors.card, padding: 12, marginBottom: 6, borderRadius: 4, borderWidth: 1, borderColor: colors.border },
  name: { fontSize: 13, fontWeight: '700', color: colors.text },
  status: { fontSize: 11, color: colors.textMuted, marginTop: 4 },
  empty: { fontSize: 12, color: colors.textDim, textAlign: 'center', padding: 16 },
  error: { color: colors.live, textAlign: 'center', marginTop: 24 },
})
