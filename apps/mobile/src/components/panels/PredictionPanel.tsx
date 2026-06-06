import { StyleSheet, Text, View } from 'react-native'
import { winProbability } from '../../lib/prediction'
import { liveRates } from '../../lib/matchStats'
import type { ScorecardData } from '../../types/scorecard'
import { colors } from '../../theme/colors'

export function PredictionPanel({ data }: { data: ScorecardData }) {
  const pct = winProbability(data)
  const rates = liveRates(data)
  const chasing = data.matchStarted && !data.matchEnded && data.score.length >= 2

  if (data.matchEnded) {
    return (
      <View style={styles.card}>
        <Text style={styles.label}>MATCH RESULT</Text>
        <Text style={styles.status}>{data.status}</Text>
      </View>
    )
  }

  if (!chasing || pct == null) {
    return (
      <View style={styles.card}>
        <Text style={styles.label}>WIN PROBABILITY</Text>
        <Text style={styles.muted}>Available once second innings chase begins.</Text>
      </View>
    )
  }

  const chasingTeam = data.score[data.score.length - 1]?.inning ?? 'Chasing team'

  return (
    <View>
      <View style={styles.card}>
        <Text style={styles.label}>CHASE WIN %</Text>
        <Text style={styles.team}>{chasingTeam}</Text>
        <View style={styles.barTrack}>
          <View style={[styles.barFill, { width: `${pct}%` }]} />
        </View>
        <Text style={styles.pct}>{pct}%</Text>
        {rates && (
          <Text style={styles.hint}>
            Need {rates.target != null ? rates.target - rates.runs : '—'} runs · RRR {rates.rrr?.toFixed(2) ?? '—'}
          </Text>
        )}
        <Text style={styles.disclaimer}>Estimate from overs & wickets left — not bookmaker odds.</Text>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  card: { backgroundColor: colors.card, borderRadius: 6, padding: 16, marginBottom: 10, borderWidth: 1, borderColor: colors.border },
  label: { fontSize: 10, fontWeight: '800', color: colors.textDim, letterSpacing: 0.8, marginBottom: 8 },
  team: { fontSize: 14, fontWeight: '700', color: colors.text, marginBottom: 12 },
  barTrack: { height: 14, backgroundColor: colors.surfaceAlt, borderRadius: 7, overflow: 'hidden' },
  barFill: { height: '100%', backgroundColor: colors.header, borderRadius: 7 },
  pct: { fontSize: 32, fontWeight: '900', color: colors.score, marginTop: 10 },
  hint: { fontSize: 13, color: colors.textMuted, marginTop: 6, fontWeight: '600' },
  status: { fontSize: 15, fontWeight: '700', color: colors.lineStatus },
  muted: { fontSize: 13, color: colors.textDim },
  disclaimer: { fontSize: 10, color: colors.textDim, marginTop: 10, fontStyle: 'italic' },
})
