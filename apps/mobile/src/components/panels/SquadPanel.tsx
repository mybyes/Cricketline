import { useEffect, useState } from 'react'
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native'
import { fetchMatchSquad } from '../../lib/api'
import type { SquadPlayer, SquadTeam } from '../../types/extras'
import { colors } from '../../theme/colors'

function roleShort(role?: string): string {
  const r = (role ?? '').toLowerCase()
  if (r.includes('wicket')) return 'WK'
  if (r.includes('all')) return 'AR'
  if (r.includes('bowl')) return 'BOWL'
  if (r.includes('bat')) return 'BAT'
  return role?.slice(0, 4).toUpperCase() ?? '—'
}

function roleColor(short: string): string {
  if (short === 'WK') return '#6a1b9a'
  if (short === 'AR') return '#1565c0'
  if (short === 'BOWL') return '#e65100'
  if (short === 'BAT') return '#1b5e20'
  return colors.textDim
}

function splitXi(players: SquadPlayer[]) {
  const xi = players.filter((p) => !p.substitute)
  const subs = players.filter((p) => p.substitute)
  return { xi, subs }
}

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
      {teams.map((t, i) => {
        const { xi, subs } = splitXi(t.players ?? [])
        return (
          <View key={i} style={styles.teamBlock}>
            <Text style={styles.teamName}>{t.team}</Text>
            <Text style={styles.xiLabel}>PLAYING XI ({xi.length})</Text>
            {xi.map((p, j) => (
              <PlayerRow key={j} order={j + 1} player={p} />
            ))}
            {subs.length > 0 && (
              <>
                <Text style={styles.subLabel}>SUBSTITUTES</Text>
                {subs.map((p, j) => (
                  <PlayerRow key={`s${j}`} player={p} dimmed />
                ))}
              </>
            )}
          </View>
        )
      })}
    </View>
  )
}

function PlayerRow({ player, order, dimmed }: { player: SquadPlayer; order?: number; dimmed?: boolean }) {
  const name = player.player?.name ?? '—'
  const short = roleShort(player.role)
  const bg = roleColor(short)

  return (
    <View style={[styles.playerRow, dimmed && styles.playerDim]}>
      <View style={styles.playerLeft}>
        {order != null && <Text style={styles.order}>{order}</Text>}
        <Text style={styles.player}>{name}</Text>
      </View>
      <View style={[styles.rolePill, { backgroundColor: bg }]}>
        <Text style={styles.roleText}>{short}</Text>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  teamBlock: { backgroundColor: colors.card, borderRadius: 6, marginBottom: 10, borderWidth: 1, borderColor: colors.border, overflow: 'hidden' },
  teamName: { fontSize: 12, fontWeight: '800', color: '#fff', backgroundColor: colors.header, padding: 10 },
  xiLabel: { fontSize: 9, fontWeight: '800', color: colors.textDim, letterSpacing: 0.6, paddingHorizontal: 12, paddingTop: 10, paddingBottom: 4 },
  subLabel: { fontSize: 9, fontWeight: '800', color: colors.textDim, letterSpacing: 0.6, paddingHorizontal: 12, paddingTop: 10, paddingBottom: 4, borderTopWidth: 1, borderTopColor: colors.border },
  playerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 12, paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: colors.border },
  playerDim: { opacity: 0.75 },
  playerLeft: { flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1 },
  order: { width: 20, fontSize: 11, fontWeight: '800', color: colors.textDim },
  player: { fontSize: 14, fontWeight: '600', color: colors.text, flex: 1 },
  rolePill: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 4, minWidth: 40, alignItems: 'center' },
  roleText: { fontSize: 10, fontWeight: '800', color: '#fff' },
  empty: { color: colors.textDim, textAlign: 'center', marginTop: 32 },
  error: { color: colors.live, textAlign: 'center', marginTop: 24 },
})
