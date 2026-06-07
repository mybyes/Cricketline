import { StyleSheet, Text, View } from 'react-native'
import type { ScorecardData } from '../../types/scorecard'
import { colors } from '../../theme/colors'
import { liveRates } from '../../lib/matchStats'
import { chaseSummary, inningsComparison, runsPerOverNeeded, wicketEvery } from '../../lib/ratesCalc'

export function RatesPanel({ data }: { data: ScorecardData }) {
  const rates = liveRates(data)
  const chase = chaseSummary(data)
  const compare = inningsComparison(data)
  const rpo = runsPerOverNeeded(data)
  const isLive = data.matchStarted && !data.matchEnded

  return (
    <View>
      <View style={styles.card}>
        <Text style={styles.label}>RUN RATES</Text>
        {rates ? (
          <>
            <RateRow label="Current RR" value={rates.crr != null ? rates.crr.toFixed(2) : '—'} />
            {rates.target != null && <RateRow label="Target" value={String(rates.target)} />}
            {rates.rrr != null && <RateRow label="Required RR" value={rates.rrr.toFixed(2)} highlight />}
            {rpo != null && isLive && <RateRow label="Runs needed / over" value={rpo.toFixed(2)} highlight />}
            {chase && chase.needed > 0 && isLive && (
              <RateRow label="Chase" value={`${chase.needed} off ${chase.ballsLeft} balls`} />
            )}
            {rates.wickets != null && rates.overs != null && (
              <RateRow
                label="Wicket every (overs)"
                value={wicketEvery(rates.overs, rates.wickets) ?? '—'}
              />
            )}
          </>
        ) : (
          <Text style={styles.muted}>Rates available once innings starts</Text>
        )}
      </View>

      {compare && (
        <View style={styles.card}>
          <Text style={styles.label}>INNINGS COMPARISON</Text>
          <RateRow label={compare.first.label} value={compare.first.rr != null ? `RR ${compare.first.rr.toFixed(2)}` : '—'} />
          <RateRow label={compare.second.label} value={compare.second.rr != null ? `RR ${compare.second.rr.toFixed(2)}` : '—'} highlight={compare.delta != null && compare.delta > 0} />
          {compare.delta != null && (
            <Text style={styles.delta}>
              Chasing {compare.delta >= 0 ? 'faster' : 'slower'} by {Math.abs(compare.delta).toFixed(2)} RR
            </Text>
          )}
        </View>
      )}

      {rates?.crr != null && rates.rrr != null && isLive && (
        <View style={styles.card}>
          <Text style={styles.label}>CRR vs RRR</Text>
          <View style={styles.barTrack}>
            <View style={[styles.barFill, styles.barCrr, { flex: rates.crr }]} />
            <View style={[styles.barFill, styles.barRrr, { flex: rates.rrr }]} />
          </View>
          <View style={styles.barLegend}>
            <Text style={styles.legendCrr}>CRR {rates.crr.toFixed(2)}</Text>
            <Text style={styles.legendRrr}>RRR {rates.rrr.toFixed(2)}</Text>
          </View>
        </View>
      )}

      <View style={styles.card}>
        <Text style={styles.label}>BOOKMAKER ODDS</Text>
        <Text style={styles.muted}>Fancy / bhav rates require a licensed odds feed — coming in a future update.</Text>
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
  muted: { fontSize: 12, color: colors.textDim, lineHeight: 1.5 },
  delta: { fontSize: 11, color: colors.textMuted, marginTop: 8, fontWeight: '600' },
  barTrack: { flexDirection: 'row', height: 10, borderRadius: 5, overflow: 'hidden', backgroundColor: colors.border },
  barFill: { height: '100%' },
  barCrr: { backgroundColor: colors.header },
  barRrr: { backgroundColor: '#e65100' },
  barLegend: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 8 },
  legendCrr: { fontSize: 11, fontWeight: '700', color: colors.header },
  legendRrr: { fontSize: 11, fontWeight: '700', color: '#e65100' },
})
