import { StyleSheet, Text, View } from 'react-native'
import type { ScorecardData } from '../types/scorecard'
import { colors } from '../theme/colors'
import { teamColor } from '../theme/teamColors'

/**
 * Computed win-probability estimate from the match situation (balls + wickets left,
 * required vs current rate). A simple model — like ESPN's Win Probability — NOT betting odds.
 * Renders only for a limited-overs chase, where the situation is well-defined.
 */
function oversToBalls(o: number): number {
  const w = Math.floor(o)
  return w * 6 + Math.round((o - w) * 10)
}
const clamp = (n: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, n))

export function WinProbability({ data }: { data: ScorecardData }) {
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
  const curRR = cur.totals.r / (balls / 6)

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
  const c0 = teamColor(short(data.teams[0], 0), data.teams[0])
  const c1 = teamColor(short(data.teams[1], 1), data.teams[1])

  return (
    <View style={styles.box}>
      <View style={styles.head}>
        <Text style={styles.title}>Win probability</Text>
        <Text style={styles.model}>model estimate</Text>
      </View>
      <View style={styles.bar}>
        <View style={{ width: `${pct0}%`, backgroundColor: c0 }} />
        <View style={{ width: `${pct1}%`, backgroundColor: c1 }} />
      </View>
      <View style={styles.labels}>
        <Text style={styles.label}><Text style={styles.pct}>{pct0}%</Text> {short(data.teams[0], 0)}</Text>
        <Text style={styles.label}>{short(data.teams[1], 1)} <Text style={styles.pct}>{pct1}%</Text></Text>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  box: { backgroundColor: colors.card, padding: 12, borderRadius: 6, marginBottom: 10, borderWidth: 1, borderColor: colors.border },
  head: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  title: { fontSize: 11, fontWeight: '800', color: colors.textMuted, letterSpacing: 0.6 },
  model: { fontSize: 9, fontWeight: '700', color: colors.textDim, letterSpacing: 0.4, textTransform: 'uppercase' },
  bar: { flexDirection: 'row', height: 10, borderRadius: 5, overflow: 'hidden', backgroundColor: colors.surfaceAlt },
  labels: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 6 },
  label: { fontSize: 12, color: colors.textMuted, fontWeight: '600' },
  pct: { fontSize: 13, fontWeight: '900', color: colors.score },
})
