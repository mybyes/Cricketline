import { useEffect, useState } from 'react'
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native'
import { fetchMatchSquad } from '../../lib/api'
import type { SquadPlayer, SquadTeam } from '../../types/extras'
import { colors } from '../../theme/colors'

function roleLabel(role?: string): string {
  const r = (role ?? '').toLowerCase()
  if (r.includes('wicket')) return 'Batter (WK)'
  if (r.includes('all')) return 'All Rounder'
  if (r.includes('bowl')) return 'Bowler'
  if (r.includes('bat')) return 'Batter'
  return role || 'Player'
}

function shortTeam(name: string) {
  const parts = name.trim().split(/\s+/)
  if (parts.length === 1) return name.slice(0, 4).toUpperCase()
  return parts.map((p) => p[0]).join('').slice(0, 4).toUpperCase()
}

function initials(name: string) {
  return name.split(/\s+/).map((p) => p[0]).join('').slice(0, 2).toUpperCase()
}

function splitXi(players: SquadPlayer[]) {
  return {
    xi: players.filter((p) => !p.substitute),
    bench: players.filter((p) => p.substitute),
  }
}

/** Side-by-side Playing XI / Bench — Cricket Guru style, no remote photos. */
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

  const a = teams[0]
  const b = teams[1]
  const aSplit = splitXi(a?.players ?? [])
  const bSplit = splitXi(b?.players ?? [])
  const xiRows = Math.max(aSplit.xi.length, bSplit.xi.length)
  const benchRows = Math.max(aSplit.bench.length, bSplit.bench.length)

  return (
    <View>
      <View style={styles.vsRow}>
        <Text style={styles.vsTeam}>{shortTeam(a?.team ?? 'T1')}</Text>
        <Text style={styles.vsBolt}>vs</Text>
        <Text style={styles.vsTeam}>{shortTeam(b?.team ?? 'T2')}</Text>
      </View>

      <Section title="PLAYING XI" rows={xiRows} left={aSplit.xi} right={bSplit.xi} />
      {benchRows > 0 && (
        <Section title="BENCH PLAYERS" rows={benchRows} left={aSplit.bench} right={bSplit.bench} />
      )}
    </View>
  )
}

function Section({
  title, rows, left, right,
}: {
  title: string
  rows: number
  left: SquadPlayer[]
  right: SquadPlayer[]
}) {
  return (
    <View style={styles.block}>
      <View style={styles.sectionHead}>
        <Text style={styles.sectionHeadText}>{title}</Text>
      </View>
      {Array.from({ length: rows }).map((_, i) => (
        <View key={i} style={styles.compareRow}>
          <PlayerCell player={left[i]} align="left" />
          <View style={styles.vLine} />
          <PlayerCell player={right[i]} align="right" />
        </View>
      ))}
    </View>
  )
}

function PlayerCell({
  player, align,
}: {
  player?: SquadPlayer
  align: 'left' | 'right'
}) {
  if (!player) {
    return <View style={styles.cell} />
  }
  const name = player.player?.name ?? '—'
  const role = roleLabel(player.role)
  const mirror = align === 'right'

  return (
    <View style={[styles.cell, mirror && styles.cellRight]}>
      {!mirror && <View style={styles.avatar}><Text style={styles.avatarText}>{initials(name)}</Text></View>}
      <View style={[styles.meta, mirror && styles.metaRight]}>
        <Text style={styles.name} numberOfLines={1}>{name}</Text>
        <Text style={styles.role} numberOfLines={1}>{role}</Text>
      </View>
      {mirror && <View style={styles.avatar}><Text style={styles.avatarText}>{initials(name)}</Text></View>}
    </View>
  )
}

const styles = StyleSheet.create({
  vsRow: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    backgroundColor: colors.card, borderRadius: 8, padding: 14, marginBottom: 10,
    borderWidth: 1, borderColor: colors.border,
  },
  vsTeam: { flex: 1, fontSize: 16, fontWeight: '800', color: colors.text, textAlign: 'center' },
  vsBolt: { fontSize: 14, color: colors.textDim, marginHorizontal: 8 },
  block: {
    backgroundColor: colors.card, borderRadius: 8, marginBottom: 10,
    borderWidth: 1, borderColor: colors.border, overflow: 'hidden',
  },
  sectionHead: {
    backgroundColor: colors.header, alignSelf: 'center', marginTop: 10, marginBottom: 4,
    paddingHorizontal: 16, paddingVertical: 6, borderRadius: 6,
  },
  sectionHeadText: { color: '#fff', fontSize: 11, fontWeight: '800', letterSpacing: 0.6 },
  compareRow: {
    flexDirection: 'row', borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: colors.border,
  },
  vLine: { width: StyleSheet.hairlineWidth, backgroundColor: colors.border },
  cell: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 10, paddingVertical: 10 },
  cellRight: { flexDirection: 'row' },
  avatar: {
    width: 28, height: 28, borderRadius: 14, backgroundColor: colors.surfaceAlt,
    alignItems: 'center', justifyContent: 'center',
  },
  avatarText: { fontSize: 10, fontWeight: '800', color: colors.textMuted },
  meta: { flex: 1, minWidth: 0 },
  metaRight: { alignItems: 'flex-end' },
  name: { fontSize: 12, fontWeight: '700', color: colors.text },
  role: { fontSize: 10, color: colors.textDim, marginTop: 1 },
  empty: { color: colors.textDim, textAlign: 'center', marginTop: 32 },
  error: { color: colors.live, textAlign: 'center', marginTop: 24 },
})
