import { useEffect, useMemo, useState } from 'react'
import { Pressable, StyleSheet, Text, View } from 'react-native'
import type { BbbBall } from '../../types/extras'
import type { MatchOddsBoard } from '../../types/odds'
import { ballColor } from '../../lib/ballColors'
import {
  ballLinesForOver, buildOverHistory, overOrdinal,
} from '../../lib/overHistory'
import {
  cgMatchPair, primaryTeamOdds, rateAtBall, shortSessionLabel,
} from '../../lib/matchRates'
import { buildSessionLadder } from '../../lib/sessionLadder'
import { colors } from '../../theme/colors'

/**
 * CG-style History: over accordion → per-ball rows with match + session dual rates.
 */
export function MatchHistoryPanel({
  bbb,
  odds = null,
  battingLabel = 'Score',
  matchType,
}: {
  bbb: BbbBall[]
  odds?: MatchOddsBoard | null
  battingLabel?: string
  scoreLine?: string
  matchType?: string
}) {
  const fmt = (matchType ?? '').toLowerCase()
  const ballsPerOver = fmt.includes('hundred') || fmt.includes('100') ? 5 : 6
  const overs = useMemo(() => buildOverHistory(bbb, ballsPerOver), [bbb, ballsPerOver])
  const [open, setOpen] = useState<number | null>(null)
  useEffect(() => {
    if (open == null && overs[0]) setOpen(overs[0].overNum)
  }, [overs, open])

  const team = primaryTeamOdds(odds, battingLabel)
  const baseBack = team?.back ?? 0
  const baseLay = team?.lay
  const teamLabel = team?.shortname || team?.team?.split(' ')[0] || battingLabel

  if (!bbb.length) {
    return (
      <View style={styles.empty}>
        <Text style={styles.emptyTitle}>No ball history yet</Text>
        <Text style={styles.emptySub}>Over-by-over history appears as balls are bowled.</Text>
      </View>
    )
  }

  return (
    <View style={styles.list}>
      {overs.map((ov, idx) => {
        const expanded = open === ov.overNum
        const chunk = `${ov.overRuns} Run${ov.overRuns === 1 ? '' : 's'}${
          ov.overWkts ? `, ${ov.overWkts} w` : ''
        }`
        const lines = expanded ? ballLinesForOver(ov, ballsPerOver) : []
        return (
          <View key={ov.overNum} style={idx < overs.length - 1 ? styles.rowBorder : undefined}>
            <Pressable
              onPress={() => setOpen(expanded ? null : ov.overNum)}
              style={styles.row}
              accessibilityRole="button"
              accessibilityState={{ expanded }}
            >
              <Text style={styles.after}>
                {overOrdinal(ov.overNum)} Over:
                <Text style={styles.chunk}> {chunk}</Text>
              </Text>
              <View style={styles.right}>
                <Text style={styles.score}>
                  {battingLabel}: {ov.totalRuns}-{ov.totalWkts}
                </Text>
                <Text style={styles.chev}>{expanded ? '▴' : '▾'}</Text>
              </View>
            </Pressable>
            {expanded ? (
              <View style={styles.detail}>
                {lines.map((line) => {
                  const c = ballColor(line.ball)
                  const back = rateAtBall(baseBack, line.afterBalls)
                  const [ma, mb] = cgMatchPair(back, baseLay != null ? rateAtBall(baseLay, line.afterBalls) : undefined)
                  const sess = buildSessionLadder({
                    matchType,
                    currentOvers: line.oversAtBall,
                    currentRuns: line.totalRuns,
                    ballsFaced: line.afterBalls,
                  })[0]
                  const sessLine = sess ? rateAtBall(sess.line || sess.yes || 0, line.afterBalls) : 0
                  const sa = sessLine > 0 ? Math.round(sessLine) : 0
                  const sb = sa > 0 ? sa + 1 : 0
                  const sessName = sess ? shortSessionLabel(sess.name) : ''
                  return (
                    <View key={`${line.notation}-${line.afterBalls}`} style={styles.ballRow}>
                      <View style={[styles.chip, { backgroundColor: c.bg }]}>
                        <Text style={[styles.chipT, { color: c.text }]}>{c.label}</Text>
                      </View>
                      <View style={styles.ballMid}>
                        <Text style={styles.ballScore}>
                          {line.totalRuns}-{line.totalWkts}
                          <Text style={styles.ballNot}> {line.notation}</Text>
                        </Text>
                        <Text style={styles.ballTime}>{line.timeLabel}</Text>
                      </View>
                      <View style={styles.rateBox}>
                        {baseBack > 0 ? (
                          <View style={styles.rateLine}>
                            <Text style={styles.rateName} numberOfLines={1}>{teamLabel}</Text>
                            <View style={styles.dual}>
                              <View style={styles.boxPink}><Text style={styles.num}>{ma}</Text></View>
                              <View style={styles.boxGreen}><Text style={styles.num}>{mb}</Text></View>
                            </View>
                          </View>
                        ) : null}
                        {sa > 0 ? (
                          <View style={styles.rateLine}>
                            <Text style={styles.rateName} numberOfLines={1}>{sessName}</Text>
                            <View style={styles.dual}>
                              <View style={styles.boxPink}><Text style={styles.num}>{sa}</Text></View>
                              <View style={styles.boxGreen}><Text style={styles.num}>{sb}</Text></View>
                            </View>
                          </View>
                        ) : null}
                      </View>
                    </View>
                  )
                })}
              </View>
            ) : null}
          </View>
        )
      })}
    </View>
  )
}

const styles = StyleSheet.create({
  empty: {
    backgroundColor: colors.card, borderRadius: 8, padding: 24, borderWidth: 1, borderColor: colors.border,
  },
  emptyTitle: { fontSize: 15, fontWeight: '800', color: colors.text, marginBottom: 6 },
  emptySub: { fontSize: 13, color: colors.textDim, lineHeight: 18 },
  list: {
    backgroundColor: colors.card,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    paddingVertical: 13,
    backgroundColor: '#EEF0F3',
  },
  rowBorder: { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.border },
  after: { fontSize: 13, fontWeight: '800', color: colors.text, flex: 1, paddingRight: 8 },
  chunk: { fontSize: 13, fontWeight: '600', color: colors.textMuted },
  right: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  score: { fontSize: 13, fontWeight: '800', color: colors.text },
  chev: { fontSize: 12, fontWeight: '800', color: colors.textDim, width: 14 },
  detail: { backgroundColor: colors.card },
  ballRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border,
  },
  chip: {
    width: 34, height: 34, borderRadius: 17,
    alignItems: 'center', justifyContent: 'center',
  },
  chipT: { fontSize: 13, fontWeight: '900' },
  ballMid: { flex: 1, minWidth: 0 },
  ballScore: { fontSize: 14, fontWeight: '800', color: colors.text },
  ballNot: { fontSize: 13, fontWeight: '600', color: colors.textMuted },
  ballTime: { fontSize: 11, fontWeight: '500', color: colors.textDim, marginTop: 2 },
  rateBox: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 6,
    gap: 5,
    minWidth: 118,
  },
  rateLine: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 6 },
  rateName: { fontSize: 11, fontWeight: '700', color: colors.text, maxWidth: 52 },
  dual: { flexDirection: 'row', gap: 4 },
  boxPink: {
    minWidth: 28, paddingHorizontal: 5, paddingVertical: 3, borderRadius: 3,
    backgroundColor: '#F8BBD0', alignItems: 'center',
  },
  boxGreen: {
    minWidth: 28, paddingHorizontal: 5, paddingVertical: 3, borderRadius: 3,
    backgroundColor: '#A5D6A7', alignItems: 'center',
  },
  num: { fontSize: 12, fontWeight: '900', color: colors.text, fontVariant: ['tabular-nums'] },
})
