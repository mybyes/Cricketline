import { StyleSheet, Text, View } from 'react-native'
import type { MatchOddsBoard, OddsDirection, TeamOdds } from '../../types/odds'
import type { ScorecardData } from '../../types/scorecard'
import { activeSession, matchRatePair, sessionPair } from '../../lib/matchRates'
import { colors } from '../../theme/colors'

const DIR_UP = '\u25B2'
const DIR_DOWN = '\u25BC'

function dirMark(dir?: OddsDirection) {
  if (dir === 'up') return DIR_UP
  if (dir === 'down') return DIR_DOWN
  return null
}

function leanPct(a?: TeamOdds, b?: TeamOdds): number {
  const ra = a?.back && a.back > 0 ? a.back : 0
  const rb = b?.back && b.back > 0 ? b.back : 0
  if (!ra || !rb) return 50
  const invA = 1 / ra
  const invB = 1 / rb
  return Math.round((invA / (invA + invB)) * 100)
}

function RateSide({ team, align }: { team: TeamOdds; align: 'left' | 'right' }) {
  const [a, b] = matchRatePair(team.back, team.lay)
  const mark = dirMark(team.dir)
  return (
    <View style={[
      styles.side,
      align === 'right' && styles.sideRight,
    ]}>
      <View style={[styles.sideTop, align === 'right' && styles.sideTopRight]}>
        <Text style={styles.team} numberOfLines={1}>{team.shortname || team.team}</Text>
        {mark ? (
          <Text style={[styles.dir, team.dir === 'up' ? styles.dirUp : styles.dirDown]}>{mark}</Text>
        ) : null}
      </View>
      <View style={[styles.nums, align === 'right' && styles.numsRight]}>
        <Text style={styles.num}>{a}</Text>
        <Text style={styles.numSub}>{b}</Text>
      </View>
    </View>
  )
}

/** Chalkboard rate pulse - duel lean + session tape. */
export function LineRatesPanel({
  board,
}: {
  data: ScorecardData
  board: MatchOddsBoard | null
  battingHint?: string
}) {
  if (!board?.matchOdds?.length) {
    return (
      <View style={styles.card}>
        <Text style={styles.kicker}>Match rate</Text>
        <Text style={styles.empty}>Rates appear when the line is live.</Text>
      </View>
    )
  }

  const [t0, t1] = board.matchOdds
  const session = activeSession(board)
  const sess = session ? sessionPair(session) : null
  const lean = leanPct(t0, t1)

  return (
    <View style={[styles.card, board.suspended && styles.suspended]}>
      <View style={styles.head}>
        <Text style={styles.kicker}>Match rate</Text>
        {board.suspended ? (
          <Text style={[styles.tag, styles.tagOff]}>Suspended</Text>
        ) : (
          <View style={styles.tagRow}>
            <View style={styles.dot} />
            <Text style={styles.tag}>Live</Text>
          </View>
        )}
      </View>

      {t0 && t1 ? (
        <View style={styles.arena} accessibilityLabel="Team match rates">
          <RateSide team={t0} align="left" />
          <View style={styles.mid}>
            <View style={styles.lean}>
              <View style={[styles.leanA, { flex: Math.max(1, lean) }]} />
              <View style={[styles.leanB, { flex: Math.max(1, 100 - lean) }]} />
            </View>
            <Text style={styles.midLabel}>lean</Text>
          </View>
          <RateSide team={t1} align="right" />
        </View>
      ) : (
        <View style={styles.arena}>
          {board.matchOdds.slice(0, 2).map((t) => (
            <RateSide key={t.team} team={t} align="left" />
          ))}
        </View>
      )}

      {session && sess ? (
        <View style={[styles.sess, session.status === 'settled' && styles.settled]}>
          <View style={styles.sessMeta}>
            <Text style={styles.kicker}>Session</Text>
            <Text style={styles.sessName} numberOfLines={1}>{session.name}</Text>
          </View>
          <View style={styles.tape}>
            <View style={styles.wing}>
              <Text style={styles.wingLabel}>Yes</Text>
              <Text style={styles.wingVal}>{sess[0] || '-'}</Text>
            </View>
            <View style={styles.pin}>
              <Text style={styles.pinVal}>{session.line ?? '-'}</Text>
              <Text style={styles.pinLabel}>line</Text>
            </View>
            <View style={[styles.wing, styles.wingB]}>
              <Text style={styles.wingLabel}>No</Text>
              <Text style={styles.wingVal}>{sess[1] || '-'}</Text>
            </View>
          </View>
        </View>
      ) : null}
    </View>
  )
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.header,
    borderRadius: 10,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: 'rgba(240,162,2,0.28)',
    overflow: 'hidden',
  },
  suspended: { opacity: 0.72 },
  head: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  kicker: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1.1,
    textTransform: 'uppercase',
    color: 'rgba(247,244,236,0.55)',
  },
  tagRow: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  tag: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.6,
    textTransform: 'uppercase',
    color: colors.accent,
  },
  tagOff: { color: '#FF8A80' },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.live,
  },
  empty: { fontSize: 13, color: 'rgba(247,244,236,0.65)', marginTop: 4 },
  arena: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  side: { flex: 1, minWidth: 0, gap: 4 },
  sideRight: { alignItems: 'flex-end' },
  sideTop: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  sideTopRight: { flexDirection: 'row-reverse' },
  team: {
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 0.4,
    textTransform: 'uppercase',
    color: 'rgba(247,244,236,0.72)',
  },
  dir: { fontSize: 10, fontWeight: '800' },
  dirUp: { color: colors.accent },
  dirDown: { color: '#FF8A80' },
  nums: { flexDirection: 'row', alignItems: 'baseline', gap: 6 },
  numsRight: { flexDirection: 'row-reverse' },
  num: {
    fontSize: 28,
    fontWeight: '800',
    color: '#F7F4EC',
    fontVariant: ['tabular-nums'],
    letterSpacing: -0.5,
  },
  numSub: {
    fontSize: 14,
    fontWeight: '700',
    color: 'rgba(247,244,236,0.45)',
    fontVariant: ['tabular-nums'],
  },
  mid: { width: 56, alignItems: 'center', gap: 4 },
  lean: {
    flexDirection: 'row',
    width: '100%',
    height: 4,
    borderRadius: 2,
    overflow: 'hidden',
    backgroundColor: 'rgba(247,244,236,0.12)',
  },
  leanA: { backgroundColor: colors.accent },
  leanB: { backgroundColor: 'rgba(247,244,236,0.35)' },
  midLabel: {
    fontSize: 8,
    fontWeight: '800',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
    color: 'rgba(247,244,236,0.4)',
  },
  sess: {
    marginTop: 14,
    paddingTop: 12,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: 'rgba(240,162,2,0.28)',
    gap: 10,
  },
  settled: { opacity: 0.55 },
  sessMeta: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  sessName: {
    flex: 1,
    fontSize: 12,
    fontWeight: '700',
    color: 'rgba(247,244,236,0.85)',
  },
  tape: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  wing: {
    flex: 1,
    backgroundColor: 'rgba(247,244,236,0.06)',
    borderRadius: 7,
    paddingVertical: 8,
    paddingHorizontal: 10,
    gap: 2,
  },
  wingB: { alignItems: 'flex-end' },
  wingLabel: {
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
    color: 'rgba(247,244,236,0.4)',
  },
  wingVal: {
    fontSize: 18,
    fontWeight: '800',
    color: '#F7F4EC',
    fontVariant: ['tabular-nums'],
  },
  pin: {
    minWidth: 56,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.accent,
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 10,
  },
  pinVal: {
    fontSize: 18,
    fontWeight: '900',
    color: colors.header,
    fontVariant: ['tabular-nums'],
  },
  pinLabel: {
    fontSize: 8,
    fontWeight: '800',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
    color: 'rgba(22,53,40,0.7)',
  },
})
