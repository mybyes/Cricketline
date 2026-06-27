import { Dimensions, StyleSheet, Text, View } from 'react-native'
import Svg, { Line, Polyline, Text as SvgText } from 'react-native-svg'
import type { InningScorecard } from '../types/scorecard'
import { colors } from '../theme/colors'

/** Rate history — run rate (CRR) progression per over, plus required rate (RRR) for a chase. Analytics, not odds. */
export function RateHistory({ innings, matchType }: { innings: InningScorecard[]; matchType?: string }) {
  const fmt = matchType?.toLowerCase()
  const oversTotal = fmt === 'odi' ? 50 : fmt === 'test' ? null : 20
  const cur = innings.filter((i) => (i.overRuns?.length ?? 0) > 0).slice(-1)[0]
  if (!cur) return null

  const runs = cur.overRuns!
  let cum = 0
  const crr = runs.map((r, i) => { cum += r; return cum / (i + 1) })

  let rrr: (number | null)[] | null = null
  const isChase = innings.length >= 2 && oversTotal != null
  if (isChase && oversTotal) {
    const target = (innings[0].totals?.r ?? 0) + 1
    let c = 0
    rrr = runs.map((r, i) => {
      c += r
      const oversLeft = oversTotal - (i + 1)
      const need = target - c
      return oversLeft > 0 && need > 0 ? need / oversLeft : null
    })
  }

  const maxOv = runs.length
  const allR = [...crr, ...((rrr ?? []).filter((x): x is number => x != null))]
  const maxR = Math.max(...allR, 6)
  const W = Dimensions.get('window').width - 60
  const H = 140
  const pad = 26
  const x = (ov: number) => pad + (ov / maxOv) * (W - 2 * pad)
  const y = (r: number) => H - pad - (r / maxR) * (H - 2 * pad)
  const crrPts = crr.map((r, i) => `${x(i + 1)},${y(r)}`).join(' ')
  const rrrPts = rrr ? rrr.map((r, i) => (r != null ? `${x(i + 1)},${y(r)}` : null)).filter(Boolean).join(' ') : ''
  const gridY = [0, Math.round(maxR / 2), Math.round(maxR)]

  const lastCrr = crr[crr.length - 1]
  const lastRrr = rrr ? rrr.filter((v): v is number => v != null).slice(-1)[0] : undefined

  return (
    <View style={styles.wrap}>
      <Text style={styles.label}>RATE HISTORY</Text>
      <Svg width={W} height={H}>
        {gridY.map((r) => <Line key={r} x1={pad} x2={W - pad} y1={y(r)} y2={y(r)} stroke={colors.border} strokeWidth={1} />)}
        {gridY.map((r) => <SvgText key={`t${r}`} x={pad - 4} y={y(r) + 3} fill={colors.textDim} fontSize={9} textAnchor="end">{String(r)}</SvgText>)}
        {rrr && <Polyline points={rrrPts} fill="none" stroke={colors.gold} strokeWidth={2.5} strokeDasharray="5,4" />}
        <Polyline points={crrPts} fill="none" stroke={colors.score} strokeWidth={2.5} />
      </Svg>
      <View style={styles.legend}>
        <Text style={styles.crr}>● Current {lastCrr.toFixed(2)}</Text>
        {lastRrr != null && <Text style={styles.rrr}>● Required {lastRrr.toFixed(2)}</Text>}
        <Text style={styles.cap}>Run rate · overs →</Text>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  wrap: { backgroundColor: colors.card, borderRadius: 6, padding: 14, marginBottom: 10, borderWidth: 1, borderColor: colors.border },
  label: { fontSize: 10, fontWeight: '800', color: colors.textDim, letterSpacing: 0.8, marginBottom: 12 },
  legend: { flexDirection: 'row', alignItems: 'center', gap: 14, marginTop: 8, flexWrap: 'wrap' },
  crr: { fontSize: 11, fontWeight: '700', color: colors.score },
  rrr: { fontSize: 11, fontWeight: '700', color: colors.gold },
  cap: { fontSize: 10, color: colors.textDim, marginLeft: 'auto' },
})
