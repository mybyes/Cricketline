import * as Haptics from 'expo-haptics'
import { Platform, Pressable, StyleSheet, Text, View } from 'react-native'
import type { Match } from '../types/match'
import type { MatchOddsBoard } from '../types/odds'
import { colors } from '../theme/colors'
import {
  formatScore, formatType, seriesName, teamLogo, teamScores, teamShort,
} from '../theme/matchUtils'
import { TeamAvatar } from './TeamAvatar'

/**
 * Slim chalk match card for rails.
 * Keep: format · series, LIVE pill, shortnames, score(+overs), one status line, optional rates.
 * Drop: duplicate context, full names, venue, heavy amber bar, big badges.
 */
export function MatchCard({
  match, onPress, isFavorite, onToggleFavorite, odds, onOpenTable, flush,
}: {
  match: Match; onPress: () => void; isFavorite?: boolean
  onToggleFavorite?: () => void; showDate?: boolean
  odds?: MatchOddsBoard | null
  onOpenTable?: () => void
  flush?: boolean
}) {
  const [s0, s1] = teamScores(match)
  const series = seriesName(match)
  const fmt = formatType(match)
  const isLive = match.matchStarted && !match.matchEnded

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
      accessibilityLabel={`Open ${match.teams.join(' versus ')}`}
      style={({ pressed }) => [
        styles.card,
        flush && styles.cardFlush,
        isLive && styles.cardLive,
        pressed && styles.pressed,
      ]}
    >
      <View style={styles.head}>
        <Text style={styles.meta} numberOfLines={1}>
          {isLive ? '● ' : ''}{fmt}{series ? ` · ${series}` : ''}
        </Text>
        <View style={styles.headRight}>
          {onToggleFavorite ? (
            <Pressable onPress={(e) => { e.stopPropagation(); handleFavorite() }} hitSlop={10}>
              <Text style={[styles.star, isFavorite && styles.starOn]}>{isFavorite ? '★' : '☆'}</Text>
            </Pressable>
          ) : null}
          <Text style={[styles.pill, isLive && styles.pillLive, match.matchEnded && styles.pillResult]}>
            {isLive ? 'LIVE' : match.matchEnded ? 'RESULT' : 'UP'}
          </Text>
        </View>
      </View>

      <View style={styles.scoreRow}>
        <TeamCol match={match} index={0} score={formatScore(s0)} active={isLive && !!s0} />
        <Text style={styles.v}>v</Text>
        <TeamCol match={match} index={1} score={formatScore(s1)} active={isLive && !!s1} right />
      </View>

      {isLive && odds?.matchOdds?.length ? (
        <View style={styles.oddsRow}>
          {odds.matchOdds.slice(0, 2).map((o) => (
            <View key={o.team} style={styles.oddsChip}>
              <Text style={styles.oddsTeam}>{o.shortname || o.team.slice(0, 3)}</Text>
              <Text style={styles.oddsPrice}>{o.back < 40 ? o.back.toFixed(2) : Math.round(o.back)}</Text>
            </View>
          ))}
        </View>
      ) : null}

      <Text style={[styles.status, isLive && styles.statusLive]} numberOfLines={1}>
        {match.status}
      </Text>

      {onOpenTable && match.series_id ? (
        <Pressable onPress={(e) => { e.stopPropagation(); onOpenTable() }} style={styles.tableBtn}>
          <Text style={styles.tableLink}>Points table →</Text>
        </Pressable>
      ) : null}
    </Pressable>
  )
}

function TeamCol({
  match, index, score, active, right,
}: {
  match: Match; index: number; score: string | null; active?: boolean; right?: boolean
}) {
  const name = teamShort(match, index)
  const logo = teamLogo(match, index)
  return (
    <View style={[styles.teamCol, right && styles.teamColRight]}>
      <View style={[styles.teamTop, right && styles.teamTopRight]}>
        <TeamAvatar shortname={name} name={match.teams[index]} logo={logo} size={24} />
        <Text style={styles.short}>{name}</Text>
      </View>
      <Text style={[styles.score, active && styles.scoreActive]}>{score ?? '—'}</Text>
    </View>
  )
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.card,
    marginHorizontal: 12,
    marginBottom: 10,
    borderRadius: 6,
    overflow: 'hidden',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    borderLeftWidth: 2,
    borderLeftColor: 'rgba(196,132,8,0.55)',
  },
  cardFlush: { marginHorizontal: 0, marginBottom: 0 },
  cardLive: { borderLeftColor: colors.live },
  pressed: { opacity: 0.94 },
  head: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    paddingTop: 10,
    paddingBottom: 2,
    gap: 8,
  },
  meta: { flex: 1, fontSize: 11, fontWeight: '600', color: colors.textMuted, letterSpacing: 0.2 },
  headRight: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  star: { fontSize: 16, color: colors.textDim, paddingHorizontal: 2 },
  starOn: { color: colors.gold },
  pill: {
    fontSize: 9, fontWeight: '700', letterSpacing: 0.5,
    color: colors.textDim, borderWidth: StyleSheet.hairlineWidth, borderColor: colors.border,
    paddingHorizontal: 6, paddingVertical: 2, borderRadius: 3, overflow: 'hidden',
  },
  pillLive: { color: colors.live, borderColor: 'rgba(255,59,46,0.35)' },
  pillResult: { color: colors.textMuted },
  scoreRow: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 12, paddingVertical: 10, gap: 8,
  },
  v: { fontSize: 11, fontWeight: '600', color: colors.textDim },
  teamCol: { flex: 1 },
  teamColRight: { alignItems: 'flex-end' },
  teamTop: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 4 },
  teamTopRight: { flexDirection: 'row-reverse' },
  short: { fontSize: 14, fontWeight: '700', color: colors.text },
  score: { fontSize: 15, fontWeight: '700', color: colors.text, fontVariant: ['tabular-nums'] },
  scoreActive: { color: colors.accent },
  oddsRow: { flexDirection: 'row', gap: 6, paddingHorizontal: 12, paddingBottom: 8 },
  oddsChip: {
    flex: 1, flexDirection: 'row', justifyContent: 'space-between',
    backgroundColor: colors.bg, borderRadius: 4, paddingHorizontal: 8, paddingVertical: 5,
    borderWidth: StyleSheet.hairlineWidth, borderColor: colors.border,
  },
  oddsTeam: { fontSize: 11, fontWeight: '700', color: colors.textMuted },
  oddsPrice: { fontSize: 12, fontWeight: '700', color: colors.text },
  status: {
    fontSize: 12, fontWeight: '600', color: colors.textMuted,
    paddingHorizontal: 12, paddingTop: 8, paddingBottom: 10,
    borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: colors.border,
  },
  statusLive: {
    color: colors.accent,
    backgroundColor: 'rgba(240,162,2,0.06)',
  },
  tableBtn: { paddingHorizontal: 12, paddingBottom: 10 },
  tableLink: { fontSize: 11, fontWeight: '700', color: colors.accent },
})
