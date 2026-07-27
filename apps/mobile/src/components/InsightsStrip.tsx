import { StyleSheet, Text, View } from 'react-native'
import type { MatchIntelligence } from '../types/intelligence'
import { colors } from '../theme/colors'

function shortTeam(name: string) {
  const parts = name.trim().split(/\s+/)
  if (parts.length === 1) return parts[0].slice(0, 4).toUpperCase()
  return parts.map((p) => p[0]).join('').slice(0, 4).toUpperCase()
}

/** Compact CIE insights under Live — chalkboard accent, no AI jargon. */
export function InsightsStrip({ intel }: { intel: MatchIntelligence | null }) {
  if (!intel?.narrative?.headline) return null

  const win = intel.winProbability
  const mom = intel.momentum
  const arrow = mom.direction === 'UP' ? '↑' : mom.direction === 'DOWN' ? '↓' : '→'
  const tp = intel.turningPoints?.[0]
  const batPct = win?.battingPct
  const momLabel = mom.value !== 0
    ? `${arrow} ${shortTeam(mom.team)} ${mom.value > 0 ? '+' : ''}${Math.round(mom.value)}`
    : `${arrow} ${shortTeam(mom.team)}`

  return (
    <View style={styles.wrap} accessibilityLabel="Match insights">
      <Text style={styles.kicker}>MATCH STORY</Text>
      <Text style={styles.headline}>{intel.narrative.headline}</Text>
      <Text style={styles.summary}>{intel.narrative.summary}</Text>

      {win && batPct != null ? (
        <View style={styles.win} accessibilityLabel={`${shortTeam(win.leader)} ${Math.max(win.battingPct, win.bowlingPct)} percent winning lean`}>
          <View style={styles.winLabels}>
            <Text style={styles.winLeader}>
              {shortTeam(win.leader)} {Math.max(win.battingPct, win.bowlingPct)}%
            </Text>
            <Text style={styles.winSub}>win lean · estimate</Text>
          </View>
          <View style={styles.winTrack}>
            <View style={[styles.winFill, { width: `${batPct}%` }]} />
          </View>
          <View style={styles.winEnds}>
            <Text style={styles.winEnd}>Bat {win.battingPct}%</Text>
            <Text style={styles.winEnd}>Bowl {win.bowlingPct}%</Text>
          </View>
          <Text style={styles.estimateNote}>
            Estimate from match state — not a prediction
          </Text>
        </View>
      ) : null}

      <View style={styles.metrics}>
        <View style={styles.metric}>
          <Text style={styles.metricLabel}>Pressure</Text>
          <Text style={[styles.metricValue, pressureColor(intel.pressure.level)]}>
            {intel.pressure.level}
          </Text>
        </View>
        <View style={styles.metric}>
          <Text style={styles.metricLabel}>Momentum</Text>
          <Text style={styles.metricValue}>{momLabel}</Text>
        </View>
        {intel.projection ? (
          <View style={styles.metric}>
            <Text style={styles.metricLabel}>Project</Text>
            <Text style={styles.metricValue}>
              {intel.projection.low}–{intel.projection.high}
            </Text>
          </View>
        ) : null}
        {intel.partnership.runs > 0 ? (
          <View style={styles.metric}>
            <Text style={styles.metricLabel}>Stand</Text>
            <Text style={styles.metricValue}>
              {intel.partnership.runs} ({intel.partnership.balls})
            </Text>
          </View>
        ) : null}
      </View>

      {tp ? (
        <View style={styles.tp}>
          <Text style={styles.tpKicker}>TURNING POINT · {tp.overLabel}</Text>
          <Text style={styles.tpTitle}>{tp.title}</Text>
          <Text style={styles.tpReason}>{tp.reason}</Text>
        </View>
      ) : null}
    </View>
  )
}

function pressureColor(level: string) {
  if (level === 'EXTREME' || level === 'HIGH') return { color: '#FF8A80' }
  if (level === 'MEDIUM') return { color: colors.accent }
  return { color: '#A8D5B5' }
}

const styles = StyleSheet.create({
  wrap: {
    marginTop: 2,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: 'rgba(22, 53, 40, 0.28)',
    borderLeftWidth: 3,
    borderLeftColor: colors.accent,
    borderRadius: 8,
    backgroundColor: colors.header,
    padding: 12,
  },
  kicker: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1.2,
    color: colors.accent,
    marginBottom: 4,
  },
  headline: {
    fontSize: 17,
    fontWeight: '700',
    color: colors.textOnGreen,
    marginBottom: 4,
  },
  summary: {
    fontSize: 13,
    lineHeight: 18,
    color: 'rgba(247,244,236,0.78)',
    marginBottom: 10,
  },
  win: { marginBottom: 10 },
  winLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
    marginBottom: 6,
  },
  winLeader: {
    fontSize: 15,
    fontWeight: '800',
    color: colors.textOnGreen,
  },
  winSub: {
    fontSize: 11,
    fontWeight: '600',
    color: 'rgba(247,244,236,0.55)',
    textTransform: 'uppercase',
    letterSpacing: 0.6,
  },
  winTrack: {
    height: 8,
    borderRadius: 4,
    backgroundColor: 'rgba(255,255,255,0.12)',
    overflow: 'hidden',
  },
  winFill: {
    height: '100%',
    borderRadius: 4,
    backgroundColor: colors.accent,
  },
  winEnds: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 4,
  },
  winEnd: {
    fontSize: 11,
    fontWeight: '600',
    color: 'rgba(247,244,236,0.6)',
  },
  estimateNote: {
    marginTop: 6,
    fontSize: 11,
    fontWeight: '500',
    color: 'rgba(247,244,236,0.62)',
    lineHeight: 15,
  },
  metrics: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  metric: {
    backgroundColor: 'rgba(0,0,0,0.22)',
    borderRadius: 6,
    paddingVertical: 6,
    paddingHorizontal: 10,
    minWidth: '28%',
  },
  metricLabel: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.6,
    color: 'rgba(247,244,236,0.55)',
    textTransform: 'uppercase',
    marginBottom: 2,
  },
  metricValue: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.textOnGreen,
  },
  tp: {
    marginTop: 10,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: 'rgba(240,162,2,0.22)',
  },
  tpKicker: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.8,
    color: colors.accent,
    marginBottom: 2,
  },
  tpTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.textOnGreen,
  },
  tpReason: {
    fontSize: 12,
    color: 'rgba(247,244,236,0.7)',
    marginTop: 2,
  },
})
