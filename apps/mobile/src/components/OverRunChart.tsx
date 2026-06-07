import React from 'react'
import { ScrollView, StyleSheet, Text, View } from 'react-native'
import Svg, { Rect, Text as SvgText } from 'react-native-svg'
import type { OverRuns } from '../lib/overRuns'
import { colors } from '../theme/colors'

const BAR_W = 22
const GAP = 6
const CHART_H = 100

export function OverRunChart({ data, title = 'RUNS PER OVER' }: { data: OverRuns[]; title?: string }) {
  if (!data.length) return null

  const max = Math.max(...data.map((d) => d.runs), 6)
  const width = data.length * (BAR_W + GAP) + 16

  return (
    <View style={styles.wrap}>
      <Text style={styles.label}>{title}</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        <Svg width={width} height={CHART_H + 28}>
          {data.map((d, i) => {
            const h = Math.max(4, (d.runs / max) * CHART_H)
            const x = 8 + i * (BAR_W + GAP)
            const y = CHART_H - h
            const fill = d.runs >= 10 ? '#e65100' : d.runs >= 6 ? '#f9a825' : colors.header
            return (
              <React.Fragment key={d.over}>
                <Rect x={x} y={y} width={BAR_W} height={h} rx={3} fill={fill} />
                <SvgText x={x + BAR_W / 2} y={CHART_H + 14} fill={colors.textDim} fontSize={9} fontWeight="600" textAnchor="middle">
                  {d.over}
                </SvgText>
                <SvgText x={x + BAR_W / 2} y={y - 3} fill={colors.text} fontSize={9} fontWeight="700" textAnchor="middle">
                  {d.runs}
                </SvgText>
              </React.Fragment>
            )
          })}
        </Svg>
      </ScrollView>
    </View>
  )
}

const styles = StyleSheet.create({
  wrap: { backgroundColor: colors.card, borderRadius: 6, padding: 14, marginBottom: 10, borderWidth: 1, borderColor: colors.border },
  label: { fontSize: 10, fontWeight: '800', color: colors.textDim, letterSpacing: 0.8, marginBottom: 12 },
})
