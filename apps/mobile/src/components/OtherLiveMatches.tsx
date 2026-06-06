import { Pressable, StyleSheet, Text, View } from 'react-native'
import type { Match } from '../types/match'
import { colors } from '../theme/colors'
import { formatScore, teamScores, teamShort } from '../theme/matchUtils'

export function OtherLiveMatches({
  matches, onSelect,
}: {
  matches: Match[]
  onSelect: (m: Match) => void
}) {
  if (!matches.length) return null

  return (
    <View style={styles.box}>
      <Text style={styles.label}>OTHER LIVE MATCHES</Text>
      {matches.map((m) => {
        const [s0] = teamScores(m)
        return (
          <Pressable key={m.id} style={styles.row} onPress={() => onSelect(m)} accessibilityRole="button">
            <Text style={styles.teams} numberOfLines={1}>
              {teamShort(m, 0)} vs {teamShort(m, 1)}
            </Text>
            <Text style={styles.score}>{formatScore(s0) ?? m.status}</Text>
          </Pressable>
        )
      })}
    </View>
  )
}

const styles = StyleSheet.create({
  box: { backgroundColor: colors.card, padding: 12, borderRadius: 6, marginTop: 10, borderWidth: 1, borderColor: colors.border },
  label: { fontSize: 10, fontWeight: '800', color: colors.textDim, letterSpacing: 0.8, marginBottom: 8 },
  row: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: colors.border },
  teams: { fontSize: 13, fontWeight: '700', color: colors.text, flex: 1 },
  score: { fontSize: 12, fontWeight: '800', color: colors.score },
})
