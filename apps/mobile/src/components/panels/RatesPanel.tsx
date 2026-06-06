import { StyleSheet, Text, View } from 'react-native'
import type { ScorecardData } from '../../types/scorecard'
import { colors } from '../../theme/colors'
import { liveRates } from '../../lib/matchStats'

/** Match rates (fancy/bhav) — placeholder until odds feed is integrated */
export function RatesPanel({ data }: { data: ScorecardData }) {
  const rates = liveRates(data)

  return (
    <View>
      <View style={styles.card}>
        <Text style={styles.label}>RUN RATES</Text>
        {rates ? (
          <>
            <RateRow label="Current RR" value={rates.crr != null ? rates.crr.toFixed(2) : '—'} />
            {rates.target != null && <RateRow label="Target" value={String(rates.target)} />}
            {rates.rrr != null && <RateRow label="Required RR" value={rates.rrr.toFixed(2)} highlight />}
          </>
        ) : (
          <Text style={styles.muted}>Rates available once innings starts</Text>
        )}
      </View>

    </View>
  )
}

function RateRow({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
  return (
    <View style={styles.row}>
      <Text style={styles.rowLabel}>{label}</Text>
      <Text style={[styles.rowVal, highlight && styles.highlight]}>{value}</Text>
    </View>
  )
}

const styles = StyleSheet.create({
  card: { backgroundColor: colors.card, borderRadius: 6, padding: 14, marginBottom: 10, borderWidth: 1, borderColor: colors.border },
  label: { fontSize: 10, fontWeight: '800', color: colors.textDim, letterSpacing: 0.8, marginBottom: 10 },
  row: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: colors.border },
  rowLabel: { fontSize: 13, color: colors.textMuted },
  rowVal: { fontSize: 15, fontWeight: '800', color: colors.text },
  highlight: { color: colors.score },
  muted: { fontSize: 12, color: colors.textDim, lineHeight: 18 },
})
