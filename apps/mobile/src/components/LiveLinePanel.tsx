import { StyleSheet, Text, View } from 'react-native'
import type { ScorecardData } from '../types/scorecard'
import { colors } from '../theme/colors'
import { formatScore } from '../theme/matchUtils'

/** Live line view — Cricket Guru / Cricline style commentary panel */
export function LiveLinePanel({ data, updatedAgo }: { data: ScorecardData; updatedAgo?: number }) {
  const isLive = data.matchStarted && !data.matchEnded
  const activeInning = data.scorecard?.[data.scorecard.length - 1]
  const batters = activeInning?.batting.filter((b) => b['dismissal-text'] === 'batting') ?? []
  const bowler = activeInning?.bowling[activeInning.bowling.length - 1]

  return (
    <View>
      {/* Main live line text */}
      <View style={[styles.lineBox, isLive && styles.lineBoxLive]}>
        <Text style={styles.lineLabel}>LIVE LINE</Text>
        <Text style={styles.lineText}>{data.status}</Text>
        {updatedAgo != null && (
          <Text style={styles.updated}>Updated {updatedAgo < 5 ? 'just now' : `${updatedAgo}s ago`}</Text>
        )}
      </View>

      {/* Score summary */}
      {data.score?.map((s, i) => (
        <View key={i} style={styles.scoreRow}>
          <Text style={styles.inningName}>{s.inning}</Text>
          <Text style={styles.inningScore}>{formatScore(s)}</Text>
        </View>
      ))}

      {/* Batters on crease */}
      {isLive && batters.length > 0 && (
        <View style={styles.creaseBox}>
          <Text style={styles.creaseLabel}>AT THE CREASE</Text>
          {batters.map((b, i) => (
            <View key={i} style={styles.creaseRow}>
              <Text style={styles.creaseName}>{b.batsman.name}*</Text>
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
  updated: { fontSize: 10, color: colors.textDim, marginTop: 6 },
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
