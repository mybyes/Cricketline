import { useCallback, useEffect, useState } from 'react'
import { ActivityIndicator, FlatList, RefreshControl, StyleSheet, Text, View } from 'react-native'
import { useNavigation } from '@react-navigation/native'
import type { NativeStackNavigationProp } from '@react-navigation/native-stack'
import { SafeAreaView } from 'react-native-safe-area-context'
import { AppHeader } from '../components/AppHeader'
import { MatchCard } from '../components/MatchCard'
import { useFavorites } from '../context/FavoritesContext'
import { fetchLiveMatches, fetchRecentMatches, fetchUpcomingMatches } from '../lib/api'
import { loadLocalFavorites, savedToMatch, type SavedMatch } from '../lib/favorites'
import type { Match, RootStackParamList } from '../types/match'
import { colors } from '../theme/colors'

type Nav = NativeStackNavigationProp<RootStackParamList>

async function hydrateFavorites(saved: SavedMatch[]): Promise<Match[]> {
  if (!saved.length) return []
  const [live, upcoming, recent] = await Promise.all([
    fetchLiveMatches().catch(() => ({ success: false, data: [] as Match[] })),
    fetchUpcomingMatches().catch(() => ({ success: false, data: [] as Match[] })),
    fetchRecentMatches().catch(() => ({ success: false, data: [] as Match[] })),
  ])
  const pool = new Map<string, Match>()
  for (const m of [...live.data, ...upcoming.data, ...recent.data]) pool.set(m.id, m)
  return saved.map((s) => pool.get(s.id) ?? savedToMatch(s))
}

export function FavoritesScreen() {
  const navigation = useNavigation<Nav>()
  const { favoriteIds, toggle, refresh } = useFavorites()
  const [matches, setMatches] = useState<Match[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)

  const load = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true)
    else setLoading(true)
    if (isRefresh) await refresh()
    const saved = await loadLocalFavorites()
    setMatches(await hydrateFavorites(saved))
    setLoading(false)
    setRefreshing(false)
  }, [refresh])

  useEffect(() => {
    load()
    const poll = setInterval(() => load(true), 30_000)
    return () => clearInterval(poll)
  }, [load])

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <AppHeader title="My Matches" subtitle="Saved favorites" right={
        <View style={styles.pill}><Text style={styles.pillT}>{favoriteIds.size}</Text></View>
      } />
      {loading && !refreshing ? <ActivityIndicator color={colors.accent} style={{ marginTop: 48 }} /> : (
        <FlatList
          data={matches}
          keyExtractor={(m) => m.id}
          renderItem={({ item }) => (
            <MatchCard
              match={item}
              showDate
              isFavorite
              onToggleFavorite={() => toggle(item)}
              onPress={() => navigation.navigate('Scoreboard', {
                matchId: item.id,
                matchName: item.teams.join(' vs '),
                seriesId: item.series_id,
                matchType: item.matchType,
              })}
            />
          )}
          contentContainerStyle={{ paddingTop: 8, paddingBottom: 24 }}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => load(true)} tintColor={colors.accent} />}
          ListEmptyComponent={<Text style={styles.empty}>Tap ★ on any match to save it here</Text>}
        />
      )}
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  pill: { backgroundColor: 'rgba(255,255,255,0.2)', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
  pillT: { color: '#fff', fontWeight: '800', fontSize: 14 },
  empty: { color: colors.textDim, textAlign: 'center', marginTop: 48, fontSize: 14 },
})
