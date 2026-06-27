import { ScrollView, StyleSheet, Text, View } from 'react-native'
import type { BbbBall } from '../types/extras'
import { currentPartnership } from '../lib/partnerships'
import { ballActors, ballColor, narrateBall } from '../lib/ballColors'
import { buildOverSummaryLine, groupRecentOvers } from '../lib/bbbUtils'
import type { Match } from '../types/match'
import type { ScorecardData } from '../types/scorecard'
import { colors } from '../theme/colors'
import { formatScore, formatSr } from '../theme/matchUtils'
import { liveRates } from '../lib/matchStats'
import { OtherLiveMatches } from './OtherLiveMatches'
import { WinProbability } from './WinProbability'

export function LiveLinePanel({
  data, bbb = [], otherLive = [], onSwitchMatch,
}: {
  data: ScorecardData
  bbb?: BbbBall[]
  otherLive?: Match[]
  onSwitchMatch?: (m: Match) => void
}) {
  const isLive = data.matchStarted && !data.matchEnded
  const activeInning = data.scorecard?.[data.scorecard.length - 1]
  const batters = activeInning?.batting.filter((b) => b['dismissal-text'] === 'batting') ?? []
  const bowler = activeInning?.bowling[activeInning.bowling.length - 1]
  const rates = liveRates(data)
  const lastBalls = [...bbb].slice(-6).reverse()
  const overText = buildOverSummaryLine(bbb)
  const overGroups = groupRecentOvers(bbb, 30)
  const partnership = activeInning ? currentPartnership(activeInning) : null

  if (data.matchEnded) {
    return (
      <View>
        <View style={styles.endedBox}>
          <Text style={styles.endedLabel}>MATCH ENDED</Text>
          <Text style={styles.endedStatus}>{data.status}</Text>
        </View>
        {data.score?.map((s, i) => (
          <View key={i} style={styles.scoreRow}>
            <Text style={styles.inningName}>{s.inning}</Text>
            <Text style={styles.inningScore}>{formatScore(s)}</Text>
          </View>
        ))}
      </View>
    )
  }

  return (
    <View>
      <View style={[styles.lineBox, isLive && styles.lineBoxLive]}>
        <Text style={styles.lineLabel}>LIVE LINE</Text>
        <Text style={styles.lineText}>{data.status}</Text>
        {rates && isLive && (
          <View style={styles.rateRow}>
            {rates.crr != null && <Text style={styles.rateChip}>CRR {rates.crr.toFixed(2)}</Text>}
            {rates.rrr != null && <Text style={[styles.rateChip, styles.rrr]}>RRR {rates.rrr.toFixed(2)}</Text>}
            {partnership && partnership.ended === 'batting' && (
              <Text style={styles.rateChip}>P'ship {partnership.runs} ({partnership.balls})</Text>
            )}
            {rates.target != null && <Text style={styles.rateChip}>TGT {rates.target}</Text>}
          </View>
        )}
      </View>

      {isLive && <WinProbability data={data} />}

      {isLive && bbb.length === 0 && (
        <View style={styles.waitingBox}>
          <Text style={styles.waitingText}>Waiting for ball-by-ball data…</Text>
        </View>
      )}

      {lastBalls.length > 0 && (
        <View style={styles.bbbBox}>
          {overText ? <Text style={styles.overSummary}>{overText}</Text> : null}
          <Text style={styles.creaseLabel}>LAST 6 BALLS</Text>
          <View style={styles.ballsRow}>
            {lastBalls.map((b, i) => {
              const c = ballColor(b)
              return (
                <View key={i} style={[styles.ballChip, { backgroundColor: c.bg }]}>
                  <Text style={[styles.ballText, { color: c.text }]}>{c.label}</Text>
                </View>
              )
            })}
          </View>
          <View style={styles.ballLegend}>
            <LegendDot color="#424242" label="Dot" />
            <LegendDot color="#1565c0" label="1-3" />
            <LegendDot color="#f57f17" label="4" />
            <LegendDot color="#7b1fa2" label="6" />
            <LegendDot color="#e53935" label="W" />
          </View>
        </View>
      )}

      {overGroups.length > 0 && (
        <View style={styles.timelineBox}>
          <Text style={styles.creaseLabel}>BALL BY BALL</Text>
          <ScrollView style={styles.timelineScroll} nestedScrollEnabled>
            {overGroups.map((g) => (
              <View key={g.overNum} style={styles.overRow}>
                <Text style={styles.overNum}>Ov {g.overNum}</Text>
                <View style={styles.overBallsRow}>
                  {g.balls.map((b, i) => {
                    const c = ballColor(b)
                    return (
                      <View key={i} style={[styles.ballChipSm, { backgroundColor: c.bg }]}>
                        <Text style={[styles.ballTextSm, { color: c.text }]}>{c.label}</Text>
                      </View>
                    )
                  })}
                </View>
                <View style={styles.commentaryList}>
                  {g.balls.map((b, i) => {
                    const n = narrateBall(b)
                    const actors = ballActors(b)
                    return (
                      <View key={i} style={styles.commentaryLine}>
                        <Text style={styles.commentaryOv}>{g.overNum}.{i + 1}</Text>
                        <Text style={styles.commentaryText}>
                          {actors ? `${actors}, ` : ''}
                          {n.headline ? <Text style={styles.commentaryHl}>{n.headline} </Text> : null}
                          {n.text}
                        </Text>
                      </View>
                    )
                  })}
                </View>
              </View>
            ))}
          </ScrollView>
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
              <Text style={styles.creaseScore}>{b.r} ({b.b}) · SR {formatSr(b.sr, b.b)}</Text>
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

      {onSwitchMatch && <OtherLiveMatches matches={otherLive} onSelect={onSwitchMatch} />}
    </View>
  )
}

function LegendDot({ color, label }: { color: string; label: string }) {
  return (
    <View style={styles.legendItem}>
      <View style={[styles.legendDot, { backgroundColor: color }]} />
      <Text style={styles.legendLabel}>{label}</Text>
    </View>
  )
}

const styles = StyleSheet.create({
  lineBox: { backgroundColor: colors.surfaceAlt, padding: 14, borderRadius: 6, marginBottom: 10 },
  lineBoxLive: { backgroundColor: colors.lineBg, borderLeftWidth: 4, borderLeftColor: colors.lineStatus },
  lineLabel: { fontSize: 10, fontWeight: '900', color: colors.live, letterSpacing: 1, marginBottom: 6 },
  lineText: { fontSize: 15, fontWeight: '700', color: colors.lineStatus, lineHeight: 22 },
  rateRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 8 },
  rateChip: { fontSize: 13, fontWeight: '700', color: colors.text, backgroundColor: colors.card, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 4 },
  endedBox: { backgroundColor: colors.surfaceAlt, padding: 16, borderRadius: 6, marginBottom: 10, borderWidth: 1, borderColor: colors.border },
  endedLabel: { fontSize: 10, fontWeight: '900', color: colors.textDim, letterSpacing: 1, marginBottom: 6 },
  endedStatus: { fontSize: 16, fontWeight: '800', color: colors.score, lineHeight: 22 },
  rrr: { color: colors.score },
  waitingBox: { backgroundColor: colors.card, padding: 14, borderRadius: 6, marginBottom: 10, borderWidth: 1, borderColor: colors.border },
  waitingText: { fontSize: 12, color: colors.textDim, textAlign: 'center', fontStyle: 'italic' },
  bbbBox: { backgroundColor: colors.card, padding: 12, borderRadius: 6, marginBottom: 10, borderWidth: 1, borderColor: colors.border },
  overSummary: { fontSize: 13, fontWeight: '700', color: colors.score, marginBottom: 10, letterSpacing: 0.3 },
  ballsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  ballChip: { width: 34, height: 34, borderRadius: 17, alignItems: 'center', justifyContent: 'center' },
  ballText: { fontSize: 12, fontWeight: '900' },
  ballLegend: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginTop: 10, paddingTop: 8, borderTopWidth: 1, borderTopColor: colors.border },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  legendDot: { width: 10, height: 10, borderRadius: 5 },
  legendLabel: { fontSize: 10, color: colors.textDim, fontWeight: '600' },
  timelineBox: { backgroundColor: colors.card, padding: 12, borderRadius: 6, marginBottom: 10, borderWidth: 1, borderColor: colors.border },
  timelineScroll: { maxHeight: 220 },
  overRow: { marginBottom: 12, paddingBottom: 10, borderBottomWidth: 1, borderBottomColor: colors.border },
  overNum: { fontSize: 11, fontWeight: '800', color: colors.textDim, marginBottom: 6 },
  overBallsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 4, marginBottom: 4 },
  ballChipSm: { width: 28, height: 28, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  ballTextSm: { fontSize: 10, fontWeight: '900' },
  commentaryList: { marginTop: 6, gap: 4 },
  commentaryLine: { flexDirection: 'row', alignItems: 'flex-start', gap: 8 },
  commentaryOv: { fontSize: 11, fontWeight: '800', color: colors.textDim, width: 30, paddingTop: 1 },
  commentaryText: { flex: 1, fontSize: 12, color: colors.textMuted, lineHeight: 17 },
  commentaryHl: { fontWeight: '900', color: colors.score },
  creaseLabel: { fontSize: 10, fontWeight: '800', color: colors.textDim, letterSpacing: 0.8, marginBottom: 8 },
  scoreRow: {
    flexDirection: 'row', justifyContent: 'space-between', backgroundColor: colors.card,
    padding: 12, marginBottom: 6, borderRadius: 4, borderWidth: 1, borderColor: colors.border,
  },
  inningName: { fontSize: 13, color: colors.textMuted, fontWeight: '500' },
  inningScore: { fontSize: 18, fontWeight: '800', color: colors.scoreLive },
  creaseBox: { backgroundColor: colors.card, padding: 12, borderRadius: 6, marginBottom: 10, borderWidth: 1, borderColor: colors.border },
  creaseRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 },
  creaseName: { fontSize: 14, fontWeight: '700', color: colors.score },
  creaseScore: { fontSize: 13, color: colors.textMuted, fontWeight: '600' },
  bowlerLine: { fontSize: 12, color: colors.textMuted, marginTop: 4, fontStyle: 'italic' },
  meta: { fontSize: 12, color: colors.textDim, marginTop: 4, paddingHorizontal: 2 },
})
