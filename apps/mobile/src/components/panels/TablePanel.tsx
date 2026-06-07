import { useEffect, useState } from 'react'
import { ActivityIndicator, ScrollView, StyleSheet, Text, View } from 'react-native'
import { fetchSeriesTable } from '../../lib/api'
import type { StandingRow } from '../../types/extras'
import { colors } from '../../theme/colors'

export function TablePanel({ seriesId }: { seriesId?: string }) {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [name, setName] = useState('')
  const [rows, setRows] = useState<StandingRow[]>([])

  useEffect(() => {
    if (!seriesId) {
      setLoading(false)
      setError('Series ID not available for this match')
      return
    }
    setLoading(true)
    fetchSeriesTable(seriesId)
      .then((res) => {
        if (!res.success) throw new Error(res.error ?? 'Failed')
        setName(res.data.seriesName)
        setRows(res.data.standings)
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false))
  }, [seriesId])

  if (loading) return <ActivityIndicator color={colors.accent} style={{ marginTop: 24 }} />
  if (error) return <Text style={styles.error}>{error}</Text>
  if (!rows.length) return <Text style={styles.empty}>Points table not available for this series yet</Text>

  return (
    <View>
      <Text style={styles.series}>{name}</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        <View style={styles.table}>
          <View style={styles.head}>
            <Text style={[styles.th, styles.thTeam]}>#</Text>
            <Text style={[styles.th, styles.thName]}>Team</Text>
            <Text style={styles.th}>M</Text>
            <Text style={styles.th}>W</Text>
            <Text style={styles.th}>L</Text>
            <Text style={styles.th}>T</Text>
            <Text style={styles.th}>NR</Text>
            <Text style={styles.th}>Pts</Text>
          </View>
          {rows.map((r, i) => (
            <View key={i} style={[styles.row, i % 2 === 0 && styles.alt, i < 4 && styles.topFour]}>
              <Text style={[styles.td, styles.thTeam, styles.rank]}>{i + 1}</Text>
              <Text style={[styles.td, styles.thName, styles.teamName]} numberOfLines={1}>{r.team}</Text>
              <Text style={styles.td}>{r.m}</Text>
              <Text style={styles.td}>{r.w}</Text>
              <Text style={styles.td}>{r.l}</Text>
              <Text style={styles.td}>{r.t ?? 0}</Text>
              <Text style={styles.td}>{r.nr ?? 0}</Text>
              <Text style={[styles.td, styles.pts]}>{r.pts}</Text>
            </View>
          ))}
        </View>
      </ScrollView>
    </View>
  )
}

const styles = StyleSheet.create({
  series: { fontSize: 13, fontWeight: '700', color: colors.textMuted, marginBottom: 10 },
  table: { backgroundColor: colors.card, borderRadius: 6, overflow: 'hidden', borderWidth: 1, borderColor: colors.border, minWidth: 420 },
  head: { flexDirection: 'row', backgroundColor: colors.header, paddingVertical: 10, paddingHorizontal: 8 },
  th: { width: 32, fontSize: 9, fontWeight: '800', color: '#fff', textAlign: 'center' },
  thTeam: { width: 24 },
  thName: { width: 120, textAlign: 'left', paddingLeft: 4 },
  row: { flexDirection: 'row', paddingVertical: 10, paddingHorizontal: 8, borderBottomWidth: 1, borderBottomColor: colors.border, alignItems: 'center' },
  alt: { backgroundColor: colors.rowAlt },
  topFour: { borderLeftWidth: 3, borderLeftColor: colors.header },
  td: { width: 32, fontSize: 11, color: colors.text, textAlign: 'center' },
  rank: { fontWeight: '800', color: colors.textDim },
  teamName: { fontWeight: '600', textAlign: 'left', paddingLeft: 4 },
  pts: { fontWeight: '900', color: colors.score },
  empty: { color: colors.textDim, textAlign: 'center', marginTop: 32 },
  error: { color: colors.live, textAlign: 'center', marginTop: 24 },
})
