import { StyleSheet, Text, View } from 'react-native'
import type { MatchOddsBoard } from '../../types/odds'
import { activeSession, matchRatePair, primaryTeamOdds, sessionPair } from '../../lib/matchRates'
import { colors } from '../../theme/colors'

function DualBoxes({ left, right }: { left: string | number; right: string | number }) {
  return (
    <View style={styles.dual}>
      <View style={styles.boxPink}>
        <Text style={styles.boxNum}>{left || '—'}</Text>
      </View>
      <View style={styles.boxGreen}>
        <Text style={styles.boxNum}>{right || '—'}</Text>
      </View>
    </View>
  )
}

/** Compact match-rate chip for home cards. */
export function MatchOddsStrip({ board }: { board: MatchOddsBoard | null }) {
  const team = primaryTeamOdds(board)
  if (!team) return null
  const [a, b] = matchRatePair(team.back, team.lay)
  return (
    <View style={styles.strip}>
      <Text style={styles.stripTeam}>{team.shortname || team.team.slice(0, 3)}</Text>
      <Text style={styles.stripLabel}>Rate</Text>
      <DualBoxes left={a} right={b} />
    </View>
  )
}

/**
 * Live Line: match rate + one session — CG dual boxes (pink | green).
 */
export function OddsPanel({
  board,
  battingHint,
  compact = false,
}: {
  board: MatchOddsBoard | null
  battingHint?: string
  compact?: boolean
}) {
  if (!board) {
    return (
      <View style={styles.card}>
        <Text style={styles.label}>MATCH RATE</Text>
        <Text style={styles.empty}>Rates appear when the line is live.</Text>
      </View>
    )
  }

  const team = primaryTeamOdds(board, battingHint)
  const session = activeSession(board)
  const pair = team ? matchRatePair(team.back, team.lay) : null
  const sess = session ? sessionPair(session) : null

  return (
    <View style={[styles.card, compact && styles.cardTight]}>
      <View style={styles.head}>
        <Text style={styles.label}>MATCH RATE</Text>
        <Text style={styles.badge}>DISPLAY ONLY</Text>
      </View>

      {board.suspended ? <Text style={styles.suspended}>Line suspended</Text> : null}

      {team && pair ? (
        <View style={styles.row}>
          <Text style={styles.rowLabel} numberOfLines={1}>{team.shortname || team.team}</Text>
          <DualBoxes left={pair[0]} right={pair[1]} />
        </View>
      ) : null}

      {session && sess ? (
        <View style={[styles.row, styles.rowSession]}>
          <View style={{ flex: 1 }}>
            <Text style={styles.sessEyebrow}>SESSION</Text>
            <Text style={styles.rowLabel} numberOfLines={1}>{session.name}</Text>
          </View>
          <DualBoxes left={sess[0] || '—'} right={sess[1] || '—'} />
        </View>
      ) : null}
    </View>
  )
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.card,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: colors.border,
  },
  cardTight: { paddingVertical: 8 },
  head: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  label: { fontSize: 10, fontWeight: '800', color: colors.textDim, letterSpacing: 0.8 },
  badge: {
    fontSize: 8, fontWeight: '800', color: colors.accent, letterSpacing: 0.5,
    backgroundColor: colors.lineBg, borderWidth: 1, borderColor: 'rgba(240,162,2,0.35)',
    paddingHorizontal: 5, paddingVertical: 1, borderRadius: 2, overflow: 'hidden',
  },
  empty: { fontSize: 12, color: colors.textDim, lineHeight: 17 },
  suspended: { fontSize: 11, fontWeight: '700', color: colors.live, marginBottom: 6 },
  row: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingVertical: 8, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: colors.border,
  },
  rowSession: { marginTop: 2 },
  sessEyebrow: { fontSize: 9, fontWeight: '800', color: colors.textDim, letterSpacing: 0.6, marginBottom: 2 },
  rowLabel: { fontSize: 15, fontWeight: '800', color: colors.text, flex: 1, paddingRight: 12 },
  dual: { flexDirection: 'row', gap: 6 },
  boxPink: {
    minWidth: 48, paddingHorizontal: 12, paddingVertical: 8, borderRadius: 6,
    backgroundColor: '#FFEBEE', alignItems: 'center', justifyContent: 'center',
  },
  boxGreen: {
    minWidth: 48, paddingHorizontal: 12, paddingVertical: 8, borderRadius: 6,
    backgroundColor: '#E8F5E9', alignItems: 'center', justifyContent: 'center',
  },
  boxNum: { fontSize: 17, fontWeight: '900', color: colors.text, fontVariant: ['tabular-nums'] },
  strip: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: colors.bg, borderRadius: 6, paddingHorizontal: 10, paddingVertical: 8,
    borderWidth: 1, borderColor: colors.border,
  },
  stripTeam: { fontSize: 13, fontWeight: '800', color: colors.text },
  stripLabel: { fontSize: 10, fontWeight: '700', color: colors.textDim, flex: 1 },
})
