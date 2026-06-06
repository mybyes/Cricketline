import { StyleSheet, Text, View } from 'react-native'
import type { BbbBall } from '../types/extras'
import type { ScorecardData } from '../types/scorecard'
import { colors } from '../theme/colors'
import { formatScore } from '../theme/matchUtils'
import { liveRates } from '../lib/matchStats'

export function LiveLinePanel({
  data, updatedAgo, bbb = [],
}: {
  data: ScorecardData
  updatedAgo?: number
  bbb?: BbbBall[]
}) {
  const isLive = data.matchStarted && !data.matchEnded
  const activeInning = data.scorecard?.[data.scorecard.length - 1]
  const batters = activeInning?.batting.filter((b) => b['dismissal-text'] === 'batting') ?? []
  const bowler = activeInning?.bowling[activeInning.bowling.length - 1]
  const rates = liveRates(data)
  const lastBalls = [...bbb].slice(-6).reverse()

  return (
    <View>
      <View style={[styles.lineBox, isLive && styles.lineBoxLive]}>
        <Text style={styles.lineLabel}>LIVE LINE</Text>
        <Text style={styles.lineText}>{data.status}</Text>
        {rates && isLive && (
          <View style={styles.rateRow}>
            {rates.crr != null && <Text style={styles.rateChip}>CRR {rates.crr.toFixed(2)}</Text>}
            {rates.rrr != null && <Text style={[styles.rateChip, styles.rrr]}>RRR {rates.rrr.toFixed(2)}</Text>}
            {rates.target != null && <Text style={styles.rateChip}>TGT {rates.target}</Text>}
          </View>
        )}
        {updatedAgo != null && (
          <Text style={styles.updated}>Updated {updatedAgo < 5 ? 'just now' : `${updatedAgo}s ago`}</Text>
        )}
      </View>

      {lastBalls.length > 0 && (
        <View style={styles.bbbBox}>
          <Text style={styles.creaseLabel}>LAST BALLS</Text>
          <View style={styles.ballsRow}>
            {lastBalls.map((b, i) => (
              <View key={i} style={styles.ballChip}>
                <Text style={styles.ballText}>{b.event ?? b.runs ?? '·'}</Text>
              </View>
            ))}
          </View>
        </View>
      )}

      {data.score?.map((s, i) => (
        <View key={i} style={styles.scoreRow}>
          <Text style={styles.inningName}>{s.inning}</Text>
          <Text style={styles.inningScore}>{formatScore(s)}</Text>
        </View>
      ))}

      {isLive && batters.length > 0 && (
        <View style={styles.creaseBox}>
          <Text style={styles.creaseLabel}>AT THE CREASE</Text>
          {batters.map((b, i) => (
            <View key={i} style={styles.creaseRow}>
              <Text style={styles.creaseName}>{b.batsman.name}{i === 0 ? ' *' : ''}</Text>
              <Text style={styles.creaseScore}>{b.r} ({b.b}) · SR {b.sr.toFixed(0)}</Text>
            </View>
          ))}
          {bowler && (
            <Text style={styles.bowlerLine}>Bowling: {bowler.bowler.name} · {bowler.o}-{bowler.r}-{bowler.w}</Text>
          )}
        </View>
      )}

      {data.tossWinner && (
        <Text style={styles.meta}>Toss: {data.tossWinner} chose to {data.tossChoice}</Text>
      )}
      <Text style={styles.meta}>{data.venue}</Text>
    </View>
  )
}

const styles = StyleSheet.create({
  lineBox: { backgroundColor: colors.surfaceAlt, padding: 14, borderRadius: 6, marginBottom: 10 },
  lineBoxLive: { backgroundColor: colors.lineBg, borderLeftWidth: 4, borderLeftColor: colors.lineStatus },
  lineLabel: { fontSize: 10, fontWeight: '900', color: colors.live, letterSpacing: 1, marginBottom: 6 },
  lineText: { fontSize: 15, fontWeight: '700', color: colors.lineStatus, lineHeight: 22 },
  rateRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 8 },
  rateChip: { fontSize: 11, fontWeight: '700', color: colors.text, backgroundColor: colors.card, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 4 },
  rrr: { color: colors.score },
  updated: { fontSize: 10, color: colors.textDim, marginTop: 6 },
  bbbBox: { backgroundColor: colors.card, padding: 12, borderRadius: 6, marginBottom: 10, borderWidth: 1, borderColor: colors.border },
  ballsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  ballChip: { width: 32, height: 32, borderRadius: 16, backgroundColor: colors.surfaceAlt, alignItems: 'center', justifyContent: 'center' },
  ballText: { fontSize: 11, fontWeight: '800', color: colors.text },
  scoreRow: {
    flexDirection: 'row', justifyContent: 'space-between', backgroundColor: colors.card,
    padding: 12, marginBottom: 6, borderRadius: 4, borderWidth: 1, borderColor: colors.border,
  },
  inningName: { fontSize: 13, color: colors.textMuted, fontWeight: '500' },
  inningScore: { fontSize: 18, fontWeight: '800', color: colors.scoreLive },
  creaseBox: { backgroundColor: colors.card, padding: 12, borderRadius: 6, marginBottom: 10, borderWidth: 1, borderColor: colors.border },
  creaseLabel: { fontSize: 10, fontWeight: '800', color: colors.textDim, letterSpacing: 0.8, marginBottom: 8 },
  creaseRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 },
  creaseName: { fontSize: 14, fontWeight: '700', color: colors.score },
  creaseScore: { fontSize: 13, color: colors.textMuted, fontWeight: '600' },
  bowlerLine: { fontSize: 12, color: colors.textMuted, marginTop: 4, fontStyle: 'italic' },
  meta: { fontSize: 12, color: colors.textDim, marginTop: 4, paddingHorizontal: 2 },
})
