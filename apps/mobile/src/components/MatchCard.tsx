import * as Haptics from 'expo-haptics'
import { Platform, Pressable, StyleSheet, Text, View } from 'react-native'
import type { Match } from '../types/match'
import { matchContextLine } from '../lib/matchContext'
import { colors } from '../theme/colors'
import {
  formatDate, formatScore, formatTimeShort, formatType, seriesName,
  teamLogo, teamScores, teamShort,
} from '../theme/matchUtils'
import { LiveBadge } from './LiveBadge'
import { LivePulse } from './LivePulse'
import { TeamAvatar } from './TeamAvatar'

export function MatchCard({
  match, onPress, isFavorite, onToggleFavorite, showDate,
}: {
  match: Match; onPress: () => void; isFavorite?: boolean
  onToggleFavorite?: () => void; showDate?: boolean
}) {
  const [s0, s1] = teamScores(match)
  const series = seriesName(match)
  const fmt = formatType(match)
  const isLive = match.matchStarted && !match.matchEnded
  const time = formatTimeShort(match.dateTimeGMT)
  const context = matchContextLine(match)

  const handlePress = () => {
    if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
    onPress()
  }

  const handleFavorite = () => {
    if (Platform.OS !== 'web') Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success)
    onToggleFavorite?.()
  }

  return (
    <Pressable
      onPress={handlePress}
      accessibilityRole="button"
      accessibilityLabel={`Open ${match.teams.join(' versus ')} scorecard`}
      style={({ pressed }) => [styles.card, isLive && styles.cardLive, pressed && styles.pressed]}
    >
      <View style={styles.fmtRow}>
        <View style={styles.fmtLeft}>
          {isLive && <LivePulse size={8} />}
          <View style={[styles.fmtBadge, isLive && styles.fmtBadgeLive]}>
            <Text style={[styles.fmtText, isLive && styles.fmtTextLive]}>{isLive ? `LIVE · ${fmt}` : fmt}</Text>
          </View>
          {isLive && time ? <Text style={styles.timeText}>{time}</Text> : null}
        </View>
        <View style={styles.seriesRight}>
          {onToggleFavorite && (
            <Pressable
              onPress={(e) => { e.stopPropagation(); handleFavorite() }}
              hitSlop={12}
              accessibilityRole="button"
              accessibilityLabel={isFavorite ? 'Remove from saved matches' : 'Save this match'}
            >
              <Text style={[styles.star, isFavorite && styles.starOn]}>{isFavorite ? '★' : '☆'}</Text>
            </Pressable>
          )}
          <LiveBadge ended={match.matchEnded} started={match.matchStarted} />
        </View>
      </View>

      <Text style={styles.series} numberOfLines={1}>{series}</Text>

      <View style={styles.scoreRow}>
        <TeamLine match={match} index={0} score={formatScore(s0)} batting={isLive && !!s0} />
        <View style={styles.divider} />
        <TeamLine match={match} index={1} score={formatScore(s1)} batting={isLive && !!s1} alignRight />
      </View>

      {context ? <Text style={styles.contextLine} numberOfLines={2}>{context}</Text> : null}

      {showDate && match.date ? <Text style={styles.date}>{formatDate(match.date, match.dateTimeGMT)}</Text> : null}

      <View style={[styles.statusBar, isLive && styles.statusBarLive]}>
        <Text style={[styles.status, isLive && styles.statusLive]} numberOfLines={2}>
          {isLive ? '● ' : ''}{match.status}
        </Text>
      </View>

      <View style={styles.footer}>
        <Text style={styles.venue} numberOfLines={1}>{match.venue}</Text>
      </View>
    </Pressable>
  )
}

function TeamLine({ match, index, score, batting, alignRight }: {
  match: Match; index: number; score: string | null; batting?: boolean; alignRight?: boolean
}) {
  const name = teamShort(match, index)
  const logo = teamLogo(match, index)
  return (
    <View style={[styles.teamLine, alignRight && styles.teamLineRight]}>
      <View style={[styles.teamTop, alignRight && styles.teamTopRight]}>
        <TeamAvatar shortname={name} logo={logo} size={32} />
        <View style={alignRight ? styles.teamTextRight : undefined}>
          <Text style={styles.shortName}>{name}</Text>
          <Text style={styles.fullName} numberOfLines={1}>{match.teams[index]}</Text>
        </View>
      </View>
      <Text style={[styles.scoreText, batting && styles.scoreBatting]} accessibilityLabel={`Score ${score ?? 'yet to bat'}`}>
        {score ?? 'Yet to bat'}
      </Text>
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
  star: { fontSize: 22, color: colors.textDim, minWidth: 44, minHeight: 44, textAlign: 'center', lineHeight: 44 },
  starOn: { color: colors.gold },
  scoreRow: { flexDirection: 'row', paddingHorizontal: 12, paddingVertical: 10 },
  divider: { width: 1, backgroundColor: colors.border, marginHorizontal: 8 },
  teamLine: { flex: 1 },
  teamLineRight: { alignItems: 'flex-end' },
  teamTop: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 6 },
  teamTopRight: { flexDirection: 'row-reverse' },
  teamTextRight: { alignItems: 'flex-end' },
  shortName: { fontSize: 16, fontWeight: '800', color: colors.text },
  fullName: { fontSize: 10, color: colors.textDim, maxWidth: 110 },
  scoreText: { fontSize: 17, fontWeight: '700', color: colors.textMuted },
  scoreBatting: { color: colors.scoreLive, fontSize: 19, fontWeight: '900' },
  contextLine: { fontSize: 12, fontWeight: '700', color: colors.score, paddingHorizontal: 12, paddingBottom: 6 },
  date: { fontSize: 11, color: colors.blue, paddingHorizontal: 12, paddingBottom: 4, fontWeight: '600' },
  statusBar: { backgroundColor: colors.surfaceAlt, paddingHorizontal: 12, paddingVertical: 9, borderTopWidth: 1, borderTopColor: colors.border },
  statusBarLive: { backgroundColor: colors.lineBg },
  status: { fontSize: 12, fontWeight: '600', color: colors.score, lineHeight: 18 },
  statusLive: { color: colors.lineStatus, fontWeight: '700' },
  footer: { flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 12, paddingBottom: 11, paddingTop: 4 },
  venue: { flex: 1, fontSize: 10, color: colors.textDim },
})
