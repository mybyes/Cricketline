import { useEffect, useState } from 'react'
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native'
import { fetchMatchSquad } from '../../lib/api'
import type { SquadTeam } from '../../types/extras'
import { colors } from '../../theme/colors'

export function SquadPanel({ matchId }: { matchId: string }) {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [teams, setTeams] = useState<SquadTeam[]>([])

  useEffect(() => {
    setLoading(true)
    fetchMatchSquad(matchId)
      .then((res) => {
        if (!res.success) throw new Error(res.error ?? 'Failed')
        setTeams(Array.isArray(res.data) ? res.data : [])
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false))
  }, [matchId])

  if (loading) return <ActivityIndicator color={colors.accent} style={{ marginTop: 24 }} />
  if (error) return <Text style={styles.error}>{error}</Text>
  if (!teams.length) return <Text style={styles.empty}>Squad not announced yet</Text>

  return (
    <View>
      {teams.map((t, i) => (
        <View key={i} style={styles.teamBlock}>
          <Text style={styles.teamName}>{t.team}</Text>
          {(t.players ?? []).map((p, j) => (
            <View key={j} style={styles.playerRow}>
              <Text style={styles.player}>{p.player?.name ?? '—'}</Text>
              {p.role ? <Text style={styles.role}>{p.role}</Text> : null}
            </View>
          ))}
        </View>
      ))}
    </View>
  )
}

const styles = StyleSheet.create({
  teamBlock: { backgroundColor: colors.card, borderRadius: 6, marginBottom: 10, borderWidth: 1, borderColor: colors.border, overflow: 'hidden' },
  teamName: { fontSize: 12, fontWeight: '800', color: '#fff', backgroundColor: colors.header, padding: 10 },
  playerRow: { flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 12, paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: colors.border },
  player: { fontSize: 14, fontWeight: '600', color: colors.text },
  role: { fontSize: 11, color: colors.textDim },
  empty: { color: colors.textDim, textAlign: 'center', marginTop: 32 },
  error: { color: colors.live, textAlign: 'center', marginTop: 24 },
})
