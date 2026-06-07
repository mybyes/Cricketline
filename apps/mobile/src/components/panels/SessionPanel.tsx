import { StyleSheet, Text, View } from 'react-native'
import { OverRunChart } from '../OverRunChart'
import type { BbbBall } from '../../types/extras'
import { runsPerOver } from '../../lib/overRuns'
import { t20PhaseStats } from '../../lib/sessionPhases'
import type { ScorecardData } from '../../types/scorecard'
import { colors } from '../../theme/colors'
import { formatScore } from '../../theme/matchUtils'
import { inningRunRate, parseSessions } from '../../lib/matchStats'

export function SessionPanel({ data, bbb = [] }: { data: ScorecardData; bbb?: BbbBall[] }) {
  const session = parseSessions(data.status)
  const isTest = data.matchType?.toLowerCase() === 'test'
  const scores = data.score ?? []
  const phases = t20PhaseStats(bbb, data.matchType)
  const overRuns = runsPerOver(bbb)

  return (
    <View>
      <View style={styles.card}>
        <Text style={styles.label}>MATCH STATUS</Text>
        <Text style={styles.status}>{data.status}</Text>
        {session.day != null && <Text style={styles.dayBadge}>Day {session.day}</Text>}
        {session.isBreak && <Text style={styles.breakTag}>● {session.markers.join(' · ')}</Text>}
      </View>

      {phases.length > 0 && (
        <View style={styles.card}>
          <Text style={styles.label}>PHASE BREAKDOWN</Text>
          {phases.map((p) => (
            <View key={p.label} style={styles.phaseRow}>
              <Text style={styles.phaseLabel}>{p.label} (ov {p.overs})</Text>
              <Text style={styles.phaseVal}>{p.runs}/{p.wickets} · RR {p.rr ?? '—'}</Text>
            </View>
          ))}
        </View>
      )}

      {scores.map((s, i) => {
        const crr = inningRunRate(s.r, s.o)
        return (
          <View key={i} style={styles.inningCard}>
            <View style={styles.inningHead}>
              <Text style={styles.inningName}>{s.inning}</Text>
              <Text style={styles.inningScore}>{formatScore(s)}</Text>
            </View>
            <View style={styles.inningMeta}>
              <Text style={styles.metaChip}>Runs {s.r}</Text>
              <Text style={styles.metaChip}>Wkts {s.w}</Text>
              <Text style={styles.metaChip}>Overs {s.o}</Text>
              {crr && <Text style={[styles.metaChip, styles.crrChip]}>RR {crr}</Text>}
            </View>
          </View>
        )
      })}

      {isTest && scores.length >= 2 && (
        <View style={styles.card}>
          <Text style={styles.label}>MATCH SITUATION</Text>
          <Text style={styles.situation}>
            {scores[scores.length - 1].inning} batting · {formatScore(scores[scores.length - 1])}
          </Text>
        </View>
      )}

      {overRuns.length > 0 && <OverRunChart data={overRuns} />}
    </View>
  )
}

const styles = StyleSheet.create({
  card: { backgroundColor: colors.card, borderRadius: 6, padding: 14, marginBottom: 10, borderWidth: 1, borderColor: colors.border },
  label: { fontSize: 10, fontWeight: '800', color: colors.textDim, letterSpacing: 0.8, marginBottom: 6 },
  status: { fontSize: 14, fontWeight: '700', color: colors.lineStatus, lineHeight: 20 },
  dayBadge: { marginTop: 8, alignSelf: 'flex-start', backgroundColor: colors.header, color: '#fff', fontSize: 11, fontWeight: '800', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 4 },
  breakTag: { marginTop: 8, fontSize: 12, color: colors.live, fontWeight: '700' },
  phaseRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: colors.border },
  phaseLabel: { fontSize: 13, fontWeight: '600', color: colors.text },
  phaseVal: { fontSize: 13, fontWeight: '800', color: colors.score },
  inningCard: { backgroundColor: colors.card, borderRadius: 6, padding: 12, marginBottom: 8, borderWidth: 1, borderColor: colors.border },
  inningHead: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  inningName: { fontSize: 13, color: colors.textMuted, fontWeight: '600', flex: 1 },
  inningScore: { fontSize: 18, fontWeight: '900', color: colors.score },
  inningMeta: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  metaChip: { fontSize: 11, fontWeight: '700', color: colors.textMuted, backgroundColor: colors.surfaceAlt, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 4 },
  crrChip: { color: colors.score },
  situation: { fontSize: 14, fontWeight: '700', color: colors.text, lineHeight: 20 },
})
