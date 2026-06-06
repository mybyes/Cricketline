import { StyleSheet, Text, View } from 'react-native'
import type { ScorecardData } from '../../types/scorecard'
import { colors } from '../../theme/colors'
import { formatScore } from '../../theme/matchUtils'
import { parseSessions } from '../../lib/matchStats'

export function SessionPanel({ data }: { data: ScorecardData }) {
  const session = parseSessions(data.status)
  const isTest = data.matchType?.toLowerCase() === 'test'

  return (
    <View>
      <View style={styles.card}>
        <Text style={styles.label}>MATCH STATUS</Text>
        <Text style={styles.status}>{data.status}</Text>
      </View>

      {isTest && (
        <View style={styles.card}>
          <Text style={styles.label}>TEST SESSION</Text>
          <Text style={styles.hint}>
            Session breaks (Lunch / Tea / Stumps) are parsed from live status updates.
          </Text>
          {session.markers.length > 0 && (
            <Text style={styles.tag}>Active markers: {session.markers.join(', ')}</Text>
          )}
        </View>
      )}

      {data.score.map((s, i) => (
        <View key={i} style={styles.inningRow}>
          <Text style={styles.inningName}>{s.inning}</Text>
          <Text style={styles.inningScore}>{formatScore(s)}</Text>
        </View>
      ))}

      {!isTest && (
        <Text style={styles.note}>Session view is most detailed for Test matches. T20/ODI show inning summaries above.</Text>
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  card: { backgroundColor: colors.card, borderRadius: 6, padding: 14, marginBottom: 10, borderWidth: 1, borderColor: colors.border },
  label: { fontSize: 10, fontWeight: '800', color: colors.textDim, letterSpacing: 0.8, marginBottom: 6 },
  status: { fontSize: 14, fontWeight: '700', color: colors.lineStatus, lineHeight: 20 },
  hint: { fontSize: 12, color: colors.textMuted, lineHeight: 18 },
  tag: { fontSize: 12, color: colors.score, marginTop: 8, fontWeight: '600' },
  inningRow: { flexDirection: 'row', justifyContent: 'space-between', backgroundColor: colors.card, padding: 12, marginBottom: 6, borderRadius: 4, borderWidth: 1, borderColor: colors.border },
  inningName: { fontSize: 13, color: colors.textMuted },
  inningScore: { fontSize: 16, fontWeight: '800', color: colors.score },
  note: { fontSize: 11, color: colors.textDim, marginTop: 8, textAlign: 'center' },
})
