import { StyleSheet, Text, View } from 'react-native'
import type { MatchOddsBoard } from '../../types/odds'
import type { ScorecardData } from '../../types/scorecard'
import { activeSession, matchRatePair, sessionPair } from '../../lib/matchRates'
import { colors } from '../../theme/colors'
import { teamColor } from '../../theme/teamColors'

function oversToBalls(o: number): number {
  const w = Math.floor(o)
  return w * 6 + Math.round((o - w) * 10)
}
const clamp = (n: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, n))

/** CG pink | green dual quote. */
function DualBoxes({ left, right, dim }: { left: string | number; right: string | number; dim?: boolean }) {
  return (
    <View style={styles.dual}>
      <View style={[styles.boxPink, dim && styles.boxDim]}>
        <Text style={styles.boxNum}>{left || '—'}</Text>
      </View>
      <View style={[styles.boxGreen, dim && styles.boxDim]}>
        <Text style={styles.boxNum}>{right || '—'}</Text>
      </View>
    </View>
  )
}

/**
 * Match rates + one live session — both as CG dual boxes.
 * Hundred → "50 Balls"; T20 → "6/10/15/20 Over Runs" (next checkpoint only).
 */
export function LineRatesPanel({
  data,
  board,
}: {
  data: ScorecardData
  board: MatchOddsBoard | null
  battingHint?: string
}) {
  const session = activeSession(board)
  const win = winPct(data)
  const short = (t: string, i: number) =>
    data.teamInfo?.[i]?.shortname || t.split(' ').map((w) => w[0]).join('').slice(0, 3).toUpperCase()
  const sess = session ? sessionPair(session) : null

  return (
    <View style={styles.card}>
      {win ? (
        <>
          <View style={styles.bar}>
            <View style={{ width: `${win.pct0}%`, backgroundColor: win.c0 }} />
            <View style={{ width: `${win.pct1}%`, backgroundColor: win.c1 }} />
          </View>
          <View style={styles.winRow}>
            <Text style={styles.winSide}>
              {short(data.teams[0], 0)} <Text style={styles.pct}>{win.pct0}%</Text>
            </Text>
            <Text style={[styles.winSide, styles.winRight]}>
              <Text style={styles.pct}>{win.pct1}%</Text> {short(data.teams[1], 1)}
            </Text>
          </View>
        </>
      ) : null}

      <Text style={styles.section}>MATCH RATE</Text>
      {(board?.matchOdds ?? []).slice(0, 2).map((o) => {
        const [a, b] = matchRatePair(o.back, o.lay)
        return (
          <View key={o.team} style={[styles.row, o.dir === 'up' && styles.rowUp, o.dir === 'down' && styles.rowDown]}>
            <Text style={styles.rowLabel} numberOfLines={1}>{o.shortname || o.team}</Text>
            <DualBoxes left={a} right={b} />
          </View>
        )
      })}

      {session && sess ? (
        <>
          <Text style={[styles.section, { marginTop: 10 }]}>SESSION</Text>
          <View style={[styles.row, session.status === 'settled' && styles.rowSettled]}>
            <Text style={styles.rowLabel} numberOfLines={1}>{session.name}</Text>
            <DualBoxes left={sess[0]} right={sess[1]} dim={session.status === 'settled'} />
          </View>
        </>
      ) : null}
    </View>
  )
}

function winPct(data: ScorecardData) {
  const innings = data.scorecard ?? []
  const fmt = data.matchType?.toLowerCase()
  const oversTotal = fmt === 'odi' ? 50 : fmt === 't20' || fmt === 'match' ? 20 : null
  const cur = innings[innings.length - 1]
  if (innings.length < 2 || !oversTotal || !cur?.totals) return null

  const target = (innings[0].totals?.r ?? 0) + 1
  const balls = oversToBalls(cur.totals.o)
  const ballsLeft = oversTotal * 6 - balls
  const need = target - cur.totals.r
  if (ballsLeft <= 0 || need <= 0) return null

  const wktsLeft = 10 - cur.totals.w
  const reqRR = need / (ballsLeft / 6)
  const curRR = cur.totals.r / Math.max(0.1, balls / 6)

  let p = 0.5
  p += (curRR - reqRR) * 0.07
  p += (wktsLeft - 5) * 0.05
  p -= Math.max(0, reqRR - 9) * 0.04
  if (ballsLeft <= 12 && need > ballsLeft * 2) p -= 0.25
  const chasing = clamp(p, 0.03, 0.97)

  const innName = cur.inning.toLowerCase()
  const chasingIsTeam0 = innName.includes(data.teams[0].toLowerCase().split(' ')[0])
  const t0 = chasingIsTeam0 ? chasing : 1 - chasing
  const pct0 = Math.round(t0 * 100)
  const pct1 = 100 - pct0
  const short = (t: string, i: number) =>
    data.teamInfo?.[i]?.shortname || t.split(' ').map((w) => w[0]).join('').slice(0, 3).toUpperCase()
  return {
    pct0,
    pct1,
    c0: teamColor(short(data.teams[0], 0), data.teams[0]),
    c1: teamColor(short(data.teams[1], 1), data.teams[1]),
  }
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.card, borderRadius: 8, padding: 12, marginBottom: 10,
    borderWidth: 1, borderColor: colors.border,
  },
  bar: { flexDirection: 'row', height: 8, borderRadius: 4, overflow: 'hidden', backgroundColor: colors.surfaceAlt, marginBottom: 8 },
  winRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8, marginBottom: 8 },
  winSide: { flex: 1, fontSize: 13, fontWeight: '700', color: colors.text },
  winRight: { textAlign: 'right' },
  pct: { fontWeight: '900', color: colors.score },
  section: { fontSize: 10, fontWeight: '800', color: colors.textDim, letterSpacing: 0.7, marginBottom: 4 },
  row: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingVertical: 8, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: colors.border,
  },
  rowUp: { backgroundColor: 'rgba(240,162,2,0.08)' },
  rowDown: { backgroundColor: 'rgba(255,59,46,0.06)' },
  rowSettled: { opacity: 0.55 },
  rowLabel: { flex: 1, fontSize: 14, fontWeight: '800', color: colors.text, paddingRight: 12 },
  dual: { flexDirection: 'row', gap: 6 },
  boxPink: {
    minWidth: 48, paddingHorizontal: 10, paddingVertical: 7, borderRadius: 4,
    backgroundColor: '#FFEBEE', alignItems: 'center',
  },
  boxGreen: {
    minWidth: 48, paddingHorizontal: 10, paddingVertical: 7, borderRadius: 4,
    backgroundColor: '#E8F5E9', alignItems: 'center',
  },
  boxDim: { opacity: 0.7 },
  boxNum: { fontSize: 15, fontWeight: '900', color: colors.text, fontVariant: ['tabular-nums'] },
})
