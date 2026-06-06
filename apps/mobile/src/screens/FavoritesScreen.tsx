import { useCallback, useEffect, useState } from 'react'
import { ActivityIndicator, FlatList, RefreshControl, StyleSheet, Text, View } from 'react-native'
import { useNavigation } from '@react-navigation/native'
import type { NativeStackNavigationProp } from '@react-navigation/native-stack'
import { SafeAreaView } from 'react-native-safe-area-context'
import { AppHeader } from '../components/AppHeader'
import { MatchCard } from '../components/MatchCard'
import { useFavorites } from '../context/FavoritesContext'
import { loadLocalFavorites, type SavedMatch } from '../lib/favorites'
import type { Match, RootStackParamList } from '../types/match'
import { colors } from '../theme/colors'

type Nav = NativeStackNavigationProp<RootStackParamList>
const toMatch = (s: SavedMatch): Match => ({
  id: s.id, name: s.name, teams: s.teams, teamInfo: s.teamInfo ?? [], venue: s.venue, date: s.date,
  dateTimeGMT: s.date, matchType: s.matchType, status: s.status, matchStarted: s.matchStarted, matchEnded: s.matchEnded, score: [],
})

export function FavoritesScreen() {
  const navigation = useNavigation<Nav>()
  const { favoriteIds, toggle, refresh } = useFavorites()
  const [matches, setMatches] = useState<SavedMatch[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)

  const load = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true); else setLoading(true)
    if (isRefresh) await refresh()
    setMatches(await loadLocalFavorites())
    setLoading(false); setRefreshing(false)
  }, [refresh])

  useEffect(() => { load() }, [load])

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <AppHeader title="My Matches" subtitle="Saved favorites" right={
        <View style={styles.pill}><Text style={styles.pillT}>{favoriteIds.size}</Text></View>
      } />
      {loading && !refreshing ? <ActivityIndicator color={colors.accent} style={{ marginTop: 48 }} /> : (
        <FlatList
          data={matches}
          keyExtractor={(m) => m.id}
          renderItem={({ item }) => {
            const m = toMatch(item)
            return <MatchCard match={m} showDate isFavorite onToggleFavorite={() => toggle(m)}
              onPress={() => navigation.navigate('Scoreboard', {
                matchId: item.id,
                matchName: item.name,
                seriesId: (item as { series_id?: string }).series_id,
              })} />
          }}
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
