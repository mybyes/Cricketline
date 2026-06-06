import { useCallback, useEffect, useState } from 'react'
import {
  ActivityIndicator,
  FlatList,
  RefreshControl,
  StyleSheet,
  Text,
  View,
} from 'react-native'
import { useNavigation } from '@react-navigation/native'
import type { NativeStackNavigationProp } from '@react-navigation/native-stack'
import { SafeAreaView } from 'react-native-safe-area-context'
import { MatchCard } from '../components/MatchCard'
import { useFavorites } from '../context/FavoritesContext'
import { loadLocalFavorites, type SavedMatch } from '../lib/favorites'
import type { Match, RootStackParamList } from '../types/match'
import { colors } from '../theme/colors'

type Nav = NativeStackNavigationProp<RootStackParamList>

function savedToMatch(saved: SavedMatch): Match {
  return {
    id: saved.id,
    name: saved.name,
    teams: saved.teams,
    teamInfo: saved.teamInfo ?? [],
    venue: saved.venue,
    date: saved.date,
    dateTimeGMT: saved.date,
    matchType: saved.matchType,
    status: saved.status,
    matchStarted: saved.matchStarted,
    matchEnded: saved.matchEnded,
    score: [],
  }
}

export function FavoritesScreen() {
  const navigation = useNavigation<Nav>()
  const { favoriteIds, toggle, refresh } = useFavorites()
  const [matches, setMatches] = useState<SavedMatch[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)

  const load = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true)
    else setLoading(true)
    if (isRefresh) await refresh()
    setMatches(await loadLocalFavorites())
    setLoading(false)
    setRefreshing(false)
  }, [refresh])

  useEffect(() => { load() }, [load])

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>Favorites</Text>
          <Text style={styles.subtitle}>Your saved matches</Text>
        </View>
        <View style={styles.countBadge}>
          <Text style={styles.countNum}>{favoriteIds.size}</Text>
        </View>
      </View>

      {loading && !refreshing ? (
        <ActivityIndicator color={colors.accent} style={styles.loader} />
      ) : (
        <FlatList
          data={matches}
          keyExtractor={(m) => m.id}
          renderItem={({ item }) => {
            const match = savedToMatch(item)
            return (
              <MatchCard
                match={match}
                showDate
                isFavorite
                onToggleFavorite={() => toggle(match)}
                onPress={() =>
                  navigation.navigate('Scoreboard', {
                    matchId: item.id,
                    matchName: item.name,
                  })
                }
              />
            )
          }}
          contentContainerStyle={styles.list}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={() => load(true)} tintColor={colors.accent} />
          }
          ListEmptyComponent={
            <View style={styles.emptyBox}>
              <Text style={styles.emptyIcon}>☆</Text>
              <Text style={styles.emptyTitle}>No favorites yet</Text>
              <Text style={styles.empty}>Tap the star on any match to save it here</Text>
            </View>
          }
        />
      )}
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 16,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  title: { fontSize: 22, fontWeight: '800', color: colors.text },
  subtitle: { fontSize: 13, color: colors.textMuted, marginTop: 2 },
  countBadge: {
    backgroundColor: colors.surfaceRaised,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.border,
  },
  countNum: { fontSize: 18, fontWeight: '800', color: colors.gold },
  list: { padding: 16, paddingBottom: 32 },
  loader: { marginTop: 48 },
  emptyBox: { alignItems: 'center', marginTop: 64, paddingHorizontal: 32 },
  emptyIcon: { fontSize: 48, color: colors.textDim },
  emptyTitle: { fontSize: 18, fontWeight: '600', color: colors.text, marginTop: 12 },
  empty: { fontSize: 14, color: colors.textDim, textAlign: 'center', marginTop: 8, lineHeight: 20 },
})
