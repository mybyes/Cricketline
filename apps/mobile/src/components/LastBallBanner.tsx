import { StyleSheet, Text, View } from 'react-native'
import type { BbbBall } from '../types/extras'
import { ballColor, narrateBall } from '../lib/ballColors'
import { getCurrentOverBalls, getCurrentOverNum, groupRecentOvers } from '../lib/bbbUtils'
import { colors } from '../theme/colors'

function overRuns(balls: BbbBall[]): number {
  return balls.reduce((s, b) => s + (typeof b.runs === 'number' ? b.runs : 0), 0)
}

function OverSegment({ balls, showTotal }: { balls: BbbBall[]; showTotal?: boolean }) {
  const total = overRuns(balls)
  return (
    <View style={styles.seg}>
      {balls.map((b, i) => {
        const c = ballColor(b)
        return (
          <View key={i} style={[styles.ballChip, { backgroundColor: c.bg }]}>
            <Text style={[styles.ballText, { color: c.text }]}>{c.label}</Text>
          </View>
        )
      })}
      {showTotal ? <Text style={styles.overTotal}>= {total}</Text> : null}
    </View>
  )
}

/** Night-chalkboard last ball on chalk page — high contrast hero. */
export function LastBallBanner({
  bbb,
  scoreLine,
}: {
  bbb: BbbBall[]
  scoreLine?: string
}) {
  if (!bbb.length) return null

  const last = bbb[bbb.length - 1]
  const narr = narrateBall(last)
  const headline = narr.headline
    ? narr.headline === 'OUT!' ? 'Wicket' : narr.headline === 'SIX' ? '6 Runs' : narr.headline === 'FOUR' ? '4 Runs' : narr.headline
    : narr.text.replace(/^(\d+) run(s)?$/i, (_: string, n: string, s: string) => `${n} Run${s ? 's' : ''}`)
      .replace(/^no run$/i, '0 Run')

  const overs = groupRecentOvers(bbb, 18).slice(0, 2).reverse()
  const curOver = getCurrentOverNum(bbb)
  const curBalls = getCurrentOverBalls(bbb)

  return (
    <View style={styles.wrap}>
      <View style={styles.banner}>
        <View style={styles.bannerTop}>
          <View style={styles.livePill}>
            <View style={styles.liveDot} />
            <Text style={styles.liveTxt}>LIVE</Text>
          </View>
        </View>
        <Text style={styles.headline} numberOfLines={1}>{headline}</Text>
        {scoreLine ? (
          <View style={styles.scoreBar}>
            <Text style={styles.scoreBarTxt} numberOfLines={1}>{scoreLine}</Text>
          </View>
        ) : null}
      </View>

      {(overs.length > 0 || curBalls.length > 0) && (
        <View style={styles.overStrip}>
          {overs.map((g) => (
            <OverSegment
              key={g.overNum}
              balls={g.balls}
              showTotal={g.overNum !== curOver || g.balls.length >= 6}
            />
          ))}
          {curOver != null && !overs.some((g) => g.overNum === curOver) && curBalls.length > 0 ? (
            <OverSegment balls={curBalls} />
          ) : null}
        </View>
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  wrap: {
    marginBottom: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(26,35,54,0.35)',
    borderLeftWidth: 3,
    borderLeftColor: colors.accent,
    overflow: 'hidden',
    backgroundColor: colors.header,
  },
  banner: {
    backgroundColor: colors.header,
    paddingTop: 12,
  },
  bannerTop: { paddingHorizontal: 14, alignItems: 'flex-end', marginBottom: 2 },
  livePill: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  liveDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: colors.live },
  liveTxt: { fontSize: 10, fontWeight: '800', color: '#FF8A80', letterSpacing: 1.2 },
  headline: {
    fontSize: 26,
    fontWeight: '700',
    color: colors.textOnGreen,
    textAlign: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    letterSpacing: -0.3,
  },
  scoreBar: {
    backgroundColor: 'rgba(0,0,0,0.22)',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: 'rgba(240,162,2,0.28)',
  },
  scoreBarTxt: { fontSize: 12, fontWeight: '600', color: 'rgba(247,244,236,0.78)', textAlign: 'center' },
  overStrip: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: 8,
    backgroundColor: colors.card,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderTopWidth: 1,
    borderTopColor: 'rgba(240,162,2,0.2)',
  },
  seg: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  ballChip: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ballText: { fontSize: 10, fontWeight: '700' },
  overTotal: { fontSize: 11, fontWeight: '700', color: colors.textMuted, marginLeft: 2 },
})
