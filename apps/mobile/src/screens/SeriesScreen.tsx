import { useCallback, useEffect, useState } from 'react'
import { ActivityIndicator, FlatList, Pressable, RefreshControl, StyleSheet, Text, View } from 'react-native'
import { useNavigation } from '@react-navigation/native'
import type { NativeStackNavigationProp } from '@react-navigation/native-stack'
import { SafeAreaView } from 'react-native-safe-area-context'
import { AppHeader } from '../components/AppHeader'
import { FeedPausedCard } from '../components/FeedPausedCard'
import { fetchSeriesList } from '../lib/api'
import type { SeriesItem } from '../types/extras'
import type { RootStackParamList } from '../types/match'
import { colors } from '../theme/colors'

type Nav = NativeStackNavigationProp<RootStackParamList>

function formatRange(s: SeriesItem): string | null {
  if (!s.startDate && !s.endDate) return null
  const a = s.startDate?.slice(0, 10) ?? ''
  const b = s.endDate?.slice(0, 10) ?? ''
  if (a && b && a !== b) return `${a} → ${b}`
  return a || b || null
}

export function SeriesScreen() {
  const navigation = useNavigation<Nav>()
  const [items, setItems] = useState<SeriesItem[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError] = useState(false)

  const load = useCallback(async (pull = false) => {
    if (pull) setRefreshing(true)
    else setLoading(true)
    const res = await fetchSeriesList()
    setItems(res.success && Array.isArray(res.data) ? res.data : [])
    setError(!res.success)
    setLoading(false)
    setRefreshing(false)
  }, [])

  useEffect(() => { load() }, [load])

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <AppHeader title="Series" subtitle="Tables & fixtures by series" />
      {loading && !refreshing ? (
        <ActivityIndicator style={{ marginTop: 40 }} color={colors.accent} />
      ) : (
        <FlatList
          data={items}
          keyExtractor={(s) => s.id}
          contentContainerStyle={styles.list}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => load(true)} tintColor={colors.accent} />}
          ListEmptyComponent={
            error
              ? <FeedPausedCard onRetry={() => load(true)} />
              : <Text style={styles.empty}>No series available right now</Text>
          }
          renderItem={({ item }) => {
            const range = formatRange(item)
            return (
              <Pressable
                style={styles.row}
                onPress={() => navigation.navigate('SeriesTable', { seriesId: item.id, seriesName: item.name })}
              >
                <View style={{ flex: 1 }}>
                  <Text style={styles.name} numberOfLines={2}>{item.name}</Text>
                  {range ? <Text style={styles.meta}>{range}</Text> : null}
                </View>
                <Text style={styles.chev}>Table →</Text>
              </Pressable>
            )
          }}
        />
      )}
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  list: { padding: 12, paddingBottom: 28 },
  row: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    backgroundColor: colors.card, borderRadius: 8, borderWidth: 1, borderColor: colors.border,
    padding: 14, marginBottom: 8,
  },
  name: { fontSize: 15, fontWeight: '800', color: colors.text },
  meta: { fontSize: 12, color: colors.textDim, marginTop: 4 },
  chev: { fontSize: 12, fontWeight: '800', color: colors.accent },
  empty: { textAlign: 'center', color: colors.textDim, marginTop: 40, fontSize: 14 },
})
