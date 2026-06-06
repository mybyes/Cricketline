import { Image, Pressable, StyleSheet, Text, View } from 'react-native'
import type { Match } from '../types/match'
import { colors } from '../theme/colors'
import { LiveBadge } from './LiveBadge'

function teamShort(match: Match, index: number) {
  return match.teamInfo?.[index]?.shortname ?? match.teams[index]?.slice(0, 3).toUpperCase() ?? '—'
}

function teamLogo(match: Match, index: number) {
  return match.teamInfo?.[index]?.img
}

function latestScores(match: Match) {
  if (!match.score?.length) return [null, null] as const
  const byTeam = new Map<string, { r: number; w: number; o: number }>()
  for (const s of match.score) {
    const team = s.inning.split(' ')[0].toLowerCase()
    byTeam.set(team, { r: s.r, w: s.w, o: s.o })
  }
  const t0 = match.teams[0]?.toLowerCase()
  const t1 = match.teams[1]?.toLowerCase()
  const find = (name: string) => {
    for (const [k, v] of byTeam) if (k.includes(name) || name.includes(k)) return v
    return null
  }
  return [find(t0 ?? ''), find(t1 ?? '')] as const
}

export function MatchCard({ match, onPress }: { match: Match; onPress: () => void }) {
  const [s0, s1] = latestScores(match)
  const type = (match.matchType ?? 'match').toUpperCase()

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.card, pressed && styles.pressed]}
    >
      <View style={styles.topRow}>
        <View style={styles.typeChip}>
          <Text style={styles.typeText}>{type}</Text>
        </View>
        <LiveBadge ended={match.matchEnded} />
      </View>

      <View style={styles.teamsRow}>
        <TeamBlock name={teamShort(match, 0)} logo={teamLogo(match, 0)} score={s0} />
        <Text style={styles.vs}>vs</Text>
        <TeamBlock name={teamShort(match, 1)} logo={teamLogo(match, 1)} score={s1} align="right" />
      </View>

      <Text style={styles.status} numberOfLines={2}>{match.status}</Text>

      <View style={styles.footer}>
        <Text style={styles.venue} numberOfLines={1}>{match.venue}</Text>
        <Text style={styles.chevron}>›</Text>
      </View>
    </Pressable>
  )
}

function TeamBlock({
  name,
  logo,
  score,
  align = 'left',
}: {
  name: string
  logo?: string
  score: { r: number; w: number; o: number } | null
  align?: 'left' | 'right'
}) {
  return (
    <View style={[styles.team, align === 'right' && styles.teamRight]}>
      {logo ? <Image source={{ uri: logo }} style={styles.logo} /> : <View style={styles.logoPlaceholder} />}
      <Text style={styles.teamName}>{name}</Text>
      {score ? (
        <Text style={styles.teamScore}>
          {score.r}/{score.w} <Text style={styles.overs}>({score.o})</Text>
        </Text>
      ) : (
        <Text style={styles.yetToBat}>—</Text>
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: 16,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: colors.border,
  },
  pressed: { opacity: 0.85, transform: [{ scale: 0.99 }] },
  topRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 },
  typeChip: {
    backgroundColor: colors.surfaceRaised,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 4,
  },
  typeText: { fontSize: 10, fontWeight: '700', color: colors.blue, letterSpacing: 0.5 },
  teamsRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  team: { flex: 1, alignItems: 'flex-start' },
  teamRight: { alignItems: 'flex-end' },
  logo: { width: 36, height: 36, borderRadius: 18, marginBottom: 6 },
  logoPlaceholder: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.surfaceRaised,
    marginBottom: 6,
  },
  teamName: { fontSize: 13, fontWeight: '600', color: colors.textMuted },
  teamScore: { fontSize: 22, fontWeight: '800', color: colors.text, marginTop: 2 },
  overs: { fontSize: 14, fontWeight: '500', color: colors.textMuted },
  yetToBat: { fontSize: 18, color: colors.textDim, marginTop: 4 },
  vs: { fontSize: 12, color: colors.textDim, fontWeight: '600', marginHorizontal: 8 },
  status: { fontSize: 13, color: colors.gold, marginTop: 14, lineHeight: 18 },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  venue: { flex: 1, fontSize: 12, color: colors.textDim },
  chevron: { fontSize: 22, color: colors.accent, fontWeight: '300', marginLeft: 8 },
})
