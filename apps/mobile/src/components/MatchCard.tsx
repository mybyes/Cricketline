import { Image, Pressable, StyleSheet, Text, View } from 'react-native'
import type { Match } from '../types/match'
import { colors } from '../theme/colors'
import {
  formatDate, formatScore, formatTimeShort, formatType, seriesName,
  teamLogo, teamScores, teamShort,
} from '../theme/matchUtils'
import { LiveBadge } from './LiveBadge'

export function MatchCard({
  match, onPress, isFavorite, onToggleFavorite, showDate, updatedAgo,
}: {
  match: Match; onPress: () => void; isFavorite?: boolean
  onToggleFavorite?: () => void; showDate?: boolean; updatedAgo?: number
}) {
  const [s0, s1] = teamScores(match)
  const series = seriesName(match)
  const fmt = formatType(match)
  const isLive = match.matchStarted && !match.matchEnded
  const time = formatTimeShort(match.dateTimeGMT)

  return (
    <Pressable onPress={onPress} style={({ pressed }) => [styles.card, isLive && styles.cardLive, pressed && styles.pressed]}>
      <View style={styles.fmtRow}>
        <View style={styles.fmtLeft}>
          <View style={[styles.fmtBadge, isLive && styles.fmtBadgeLive]}>
            <Text style={[styles.fmtText, isLive && styles.fmtTextLive]}>{isLive ? `LIVE · ${fmt}` : fmt}</Text>
          </View>
          {isLive && time ? <Text style={styles.timeText}>{time}</Text> : null}
        </View>
        <View style={styles.seriesRight}>
          {onToggleFavorite && (
            <Pressable onPress={(e) => { e.stopPropagation(); onToggleFavorite() }} hitSlop={12}>
              <Text style={[styles.star, isFavorite && styles.starOn]}>{isFavorite ? '★' : '☆'}</Text>
            </Pressable>
          )}
          <LiveBadge ended={match.matchEnded} started={match.matchStarted} />
        </View>
      </View>

      <Text style={styles.series} numberOfLines={1}>{series}</Text>

      <View style={styles.scoreRow}>
        <TeamLine name={teamShort(match, 0)} fullName={match.teams[0]} logo={teamLogo(match, 0)} score={formatScore(s0)} batting={isLive && !!s0} />
        <View style={styles.divider} />
        <TeamLine name={teamShort(match, 1)} fullName={match.teams[1]} logo={teamLogo(match, 1)} score={formatScore(s1)} batting={isLive && !!s1} alignRight />
      </View>

      {showDate && match.date ? <Text style={styles.date}>{formatDate(match.date, match.dateTimeGMT)}</Text> : null}

      <View style={[styles.statusBar, isLive && styles.statusBarLive]}>
        <Text style={[styles.status, isLive && styles.statusLive]} numberOfLines={2}>
          {isLive ? '● ' : ''}{match.status}
        </Text>
      </View>

      <View style={styles.footer}>
        <Text style={styles.venue} numberOfLines={1}>{match.venue}</Text>
        {updatedAgo != null && isLive && (
          <Text style={styles.updated}>{updatedAgo < 5 ? 'just now' : `${updatedAgo}s ago`}</Text>
        )}
      </View>
    </Pressable>
  )
}

function TeamLine({ name, fullName, logo, score, batting, alignRight }: {
  name: string; fullName?: string; logo?: string; score: string | null; batting?: boolean; alignRight?: boolean
}) {
  return (
    <View style={[styles.teamLine, alignRight && styles.teamLineRight]}>
      <View style={[styles.teamTop, alignRight && styles.teamTopRight]}>
        {logo ? <Image source={{ uri: logo }} style={styles.logo} /> : <View style={styles.logoPh} />}
        <View style={alignRight ? styles.teamTextRight : undefined}>
          <Text style={styles.shortName}>{name}</Text>
          <Text style={styles.fullName} numberOfLines={1}>{fullName}</Text>
        </View>
      </View>
      <Text style={[styles.scoreText, batting && styles.scoreBatting]}>{score ?? 'Yet to bat'}</Text>
    </View>
  )
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.card, marginHorizontal: 12, marginBottom: 10, borderRadius: 8,
    overflow: 'hidden', elevation: 3, shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1, shadowRadius: 4,
  },
  cardLive: { borderLeftWidth: 4, borderLeftColor: colors.live },
  pressed: { opacity: 0.94, transform: [{ scale: 0.995 }] },
  fmtRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 12, paddingTop: 10 },
  fmtLeft: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  fmtBadge: { backgroundColor: colors.surfaceAlt, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 4 },
  fmtBadgeLive: { backgroundColor: colors.liveBg },
  fmtText: { fontSize: 10, fontWeight: '800', color: colors.score, letterSpacing: 0.5 },
  fmtTextLive: { color: colors.live },
  timeText: { fontSize: 10, color: colors.textMuted, fontWeight: '600' },
  series: { fontSize: 11, fontWeight: '600', color: colors.textMuted, paddingHorizontal: 12, paddingTop: 4, paddingBottom: 2 },
  seriesRight: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  star: { fontSize: 20, color: colors.textDim },
  starOn: { color: colors.gold },
  scoreRow: { flexDirection: 'row', paddingHorizontal: 12, paddingVertical: 10 },
  divider: { width: 1, backgroundColor: colors.border, marginHorizontal: 8 },
  teamLine: { flex: 1 },
  teamLineRight: { alignItems: 'flex-end' },
  teamTop: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 6 },
  teamTopRight: { flexDirection: 'row-reverse' },
  teamTextRight: { alignItems: 'flex-end' },
  logo: { width: 32, height: 32, borderRadius: 16 },
  logoPh: { width: 32, height: 32, borderRadius: 16, backgroundColor: colors.surfaceAlt },
  shortName: { fontSize: 16, fontWeight: '800', color: colors.text },
  fullName: { fontSize: 10, color: colors.textDim, maxWidth: 110 },
  scoreText: { fontSize: 17, fontWeight: '700', color: colors.textMuted },
  scoreBatting: { color: colors.scoreLive, fontSize: 18 },
  date: { fontSize: 11, color: colors.blue, paddingHorizontal: 12, paddingBottom: 4, fontWeight: '600' },
  statusBar: { backgroundColor: colors.surfaceAlt, paddingHorizontal: 12, paddingVertical: 9, borderTopWidth: 1, borderTopColor: colors.border },
  statusBarLive: { backgroundColor: colors.lineBg },
  status: { fontSize: 12, fontWeight: '600', color: colors.score, lineHeight: 18 },
  statusLive: { color: colors.lineStatus, fontWeight: '700' },
  footer: { flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 12, paddingBottom: 11, paddingTop: 4 },
  venue: { flex: 1, fontSize: 10, color: colors.textDim },
  updated: { fontSize: 9, color: colors.live, fontWeight: '700' },
})
