import { StyleSheet, Text, View } from 'react-native'
import type { BbbBall } from '../../types/extras'
import { currentPartnership, partnershipHistory, partnershipsFromBbb } from '../../lib/partnerships'
import type { ScorecardData } from '../../types/scorecard'
import { colors } from '../../theme/colors'

export function PartnershipPanel({ data, bbb = [] }: { data: ScorecardData; bbb?: BbbBall[] }) {
  const inning = data.scorecard?.[data.scorecard.length - 1]
  const current = inning ? currentPartnership(inning) : null
  const fromBbb = partnershipsFromBbb(bbb)
  const fromCard = inning ? partnershipHistory(inning) : []
  const history = fromBbb.length > 1 ? fromBbb.filter((p) => p.ended !== 'batting') : fromCard

  return (
    <View>
      {current && current.ended === 'batting' && (
        <View style={[styles.card, styles.current]}>
          <Text style={styles.label}>CURRENT PARTNERSHIP</Text>
          <Text style={styles.batsmen}>{current.batsmen}</Text>
          <View style={styles.statsRow}>
            <Stat label="Runs" value={String(current.runs)} />
            <Stat label="Balls" value={String(current.balls)} />
            <Stat label="RR" value={current.balls ? ((current.runs / current.balls) * 6).toFixed(1) : '—'} />
          </View>
        </View>
      )}

      <View style={styles.card}>
        <Text style={styles.label}>PARTNERSHIP HISTORY</Text>
        {history.length === 0 ? (
          <Text style={styles.muted}>No completed partnerships yet this innings</Text>
        ) : (
          history.map((p, i) => (
            <View key={i} style={[styles.row, i % 2 === 0 && styles.rowAlt]}>
              <View style={{ flex: 1 }}>
                <Text style={styles.rowName}>{p.batsmen}</Text>
                <Text style={styles.rowEnd} numberOfLines={1}>{p.ended}</Text>
              </View>
              <Text style={styles.rowRuns}>{p.runs}</Text>
              <Text style={styles.rowBalls}>{p.balls}b</Text>
            </View>
          ))
        )}
      </View>

      {fromBbb.length > 0 && (
        <View style={styles.card}>
          <Text style={styles.label}>FROM BALL-BY-BALL</Text>
          <Text style={styles.mutedSmall}>{fromBbb.length} partnership segment{fromBbb.length === 1 ? '' : 's'} tracked</Text>
        </View>
      )}
    </View>
  )
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.stat}>
      <Text style={styles.statVal}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  )
}

const styles = StyleSheet.create({
  card: { backgroundColor: colors.card, borderRadius: 6, padding: 14, marginBottom: 10, borderWidth: 1, borderColor: colors.border },
  current: { borderColor: colors.header, borderWidth: 2 },
  label: { fontSize: 10, fontWeight: '800', color: colors.textDim, letterSpacing: 0.8, marginBottom: 10 },
  batsmen: { fontSize: 16, fontWeight: '800', color: colors.text, marginBottom: 10 },
  statsRow: { flexDirection: 'row', gap: 16 },
  stat: { alignItems: 'center' },
  statVal: { fontSize: 20, fontWeight: '900', color: colors.score },
  statLabel: { fontSize: 10, color: colors.textDim, marginTop: 2 },
  row: { flexDirection: 'row', alignItems: 'center', paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: colors.border },
  rowAlt: { backgroundColor: colors.rowAlt },
  rowName: { fontSize: 13, fontWeight: '700', color: colors.text },
  rowEnd: { fontSize: 10, color: colors.textDim, marginTop: 2 },
  rowRuns: { fontSize: 16, fontWeight: '900', color: colors.score, width: 40, textAlign: 'right' },
  rowBalls: { fontSize: 11, color: colors.textMuted, width: 36, textAlign: 'right' },
  muted: { fontSize: 12, color: colors.textDim },
  mutedSmall: { fontSize: 11, color: colors.textDim },
})
