import { useCallback, useEffect, useState } from 'react'
import {
  ActivityIndicator,
  FlatList,
  RefreshControl,
  StyleSheet,
  Text,
  View,
} from 'react-native'
import { StatusBar } from 'expo-status-bar'
import { fetchLiveMatches, getApiUrl } from './src/lib/api'
import type { Match } from './src/types/match'

function formatScore(match: Match) {
  if (!match.score?.length) return null
  return match.score
    .map((s) => `${s.inning}: ${s.r}/${s.w} (${s.o})`)
    .join('  ·  ')
}

function MatchCard({ match }: { match: Match }) {
  const score = formatScore(match)
  const teams = match.teams.join(' vs ')

  return (
    <View style={styles.card}>
      <Text style={styles.teams}>{teams}</Text>
      {score ? <Text style={styles.score}>{score}</Text> : null}
      <Text style={styles.status}>{match.status}</Text>
      <Text style={styles.venue}>{match.venue}</Text>
    </View>
  )
}

export default function App() {
  const [matches, setMatches] = useState<Match[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true)
    else setLoading(true)
    setError(null)
    try {
      const res = await fetchLiveMatches()
      if (!res.success) throw new Error(res.error ?? 'API error')
      setMatches(res.data)
    } catch (e: any) {
      setError(e.message ?? 'Failed to load matches')
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [])

  useEffect(() => {
    load()
    const id = setInterval(() => load(true), 10_000)
    return () => clearInterval(id)
  }, [load])

  return (
    <View style={styles.container}>
      <StatusBar style="light" />
      <View style={styles.header}>
        <Text style={styles.title}>CricketFast</Text>
        <Text style={styles.subtitle}>Live scores · {getApiUrl()}</Text>
      </View>

      {loading && !refreshing ? (
        <ActivityIndicator color="#4ade80" style={styles.loader} />
      ) : error ? (
        <View style={styles.center}>
          <Text style={styles.error}>{error}</Text>
          <Text style={styles.hint}>
            On a real device, set EXPO_PUBLIC_API_URL to your machine's LAN IP (e.g. http://192.168.0.18:3000)
          </Text>
        </View>
      ) : (
        <FlatList
          data={matches}
          keyExtractor={(m) => m.id}
          renderItem={({ item }) => <MatchCard match={item} />}
          contentContainerStyle={styles.list}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={() => load(true)} tintColor="#4ade80" />
          }
          ListEmptyComponent={<Text style={styles.empty}>No live matches right now</Text>}
        />
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0f172a' },
  header: {
    paddingTop: 56,
    paddingBottom: 16,
    paddingHorizontal: 20,
    backgroundColor: '#1e293b',
    borderBottomWidth: 1,
    borderBottomColor: '#334155',
  },
  title: { fontSize: 28, fontWeight: '700', color: '#f8fafc' },
  subtitle: { fontSize: 12, color: '#94a3b8', marginTop: 4 },
  list: { padding: 16, gap: 12 },
  card: {
    backgroundColor: '#1e293b',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#334155',
  },
  teams: { fontSize: 16, fontWeight: '600', color: '#f1f5f9' },
  score: { fontSize: 15, color: '#4ade80', marginTop: 8, fontWeight: '500' },
  status: { fontSize: 13, color: '#fbbf24', marginTop: 6 },
  venue: { fontSize: 12, color: '#64748b', marginTop: 4 },
  loader: { marginTop: 40 },
  center: { flex: 1, justifyContent: 'center', padding: 24 },
  error: { color: '#f87171', fontSize: 16, textAlign: 'center' },
  hint: { color: '#64748b', fontSize: 13, textAlign: 'center', marginTop: 12, lineHeight: 20 },
  empty: { color: '#64748b', textAlign: 'center', marginTop: 40 },
})
