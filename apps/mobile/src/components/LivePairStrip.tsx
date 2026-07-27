import { StyleSheet, Text, View } from 'react-native'
import type { BbbBall } from '../types/extras'
import type { ScorecardData } from '../types/scorecard'
import { liveBatters, liveBowler, shortPlayer } from '../lib/liveContext'
import { colors } from '../theme/colors'

/** Current batters + bowler in one split card — sits below rates. */
export function LivePairStrip({
  data,
  bbb = [],
}: {
  data: ScorecardData
  bbb?: BbbBall[]
}) {
  if (!data.matchStarted || data.matchEnded) return null
  const batters = liveBatters(data)
  const bowler = liveBowler(data, bbb)
  if (!batters.length && !bowler) return null

  return (
    <View style={styles.card} accessibilityLabel="Current batters and bowler">
      <View style={styles.side}>
        <Text style={styles.label}>Bat</Text>
        {batters.length ? batters.map((b, i) => (
          <View key={b.batsman.id || i} style={styles.line}>
            <View style={styles.lineMain}>
              <Text style={styles.name} numberOfLines={1}>
                {shortPlayer(b.batsman.name)}{i === 0 ? ' *' : ''}
              </Text>
              <Text style={styles.meta}>SR {Math.round(b.sr)}</Text>
            </View>
            <Text style={styles.stat}>{b.r}{i === 0 ? '*' : ''} ({b.b})</Text>
          </View>
        )) : (
          <Text style={styles.empty}>Batters updating…</Text>
        )}
      </View>
      <View style={styles.divider} />
      <View style={[styles.side, styles.bowl]}>
        <Text style={styles.label}>Bowl</Text>
        {bowler ? (
          <View style={styles.line}>
            <View style={styles.lineMain}>
              <Text style={styles.name} numberOfLines={1}>{shortPlayer(bowler.bowler.name)}</Text>
              <Text style={styles.meta}>Econ {bowler.eco.toFixed(1)}</Text>
            </View>
            <Text style={styles.stat}>{bowler.w}/{bowler.r} ({bowler.o})</Text>
          </View>
        ) : (
          <Text style={styles.empty}>—</Text>
        )}
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    marginTop: 10,
    marginBottom: 4,
    backgroundColor: colors.card,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    borderRadius: 8,
    overflow: 'hidden',
  },
  side: {
    flex: 1,
    paddingHorizontal: 12,
    paddingVertical: 10,
    gap: 6,
    minWidth: 0,
  },
  bowl: { backgroundColor: 'rgba(240,162,2,0.04)' },
  divider: {
    width: StyleSheet.hairlineWidth,
    backgroundColor: colors.border,
  },
  label: {
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 1.2,
    textTransform: 'uppercase',
    color: colors.textDim,
  },
  line: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  lineMain: { flex: 1, minWidth: 0, gap: 1 },
  name: { fontSize: 13, fontWeight: '700', color: colors.text },
  stat: {
    fontSize: 13,
    fontWeight: '800',
    color: colors.score,
    fontVariant: ['tabular-nums'],
  },
  meta: { fontSize: 11, fontWeight: '600', color: colors.textMuted },
  empty: { fontSize: 12, color: colors.textDim },
})
