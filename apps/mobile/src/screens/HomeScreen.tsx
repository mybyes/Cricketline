import { StyleSheet, Text, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { MatchList } from '../components/MatchList'
import { fetchLiveMatches } from '../lib/api'
import { colors } from '../theme/colors'

export function HomeScreen() {
  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <MatchList
        title="Live"
        subtitle="Real-time scores"
        emptyText="No live matches right now"
        fetcher={fetchLiveMatches}
        pollMs={10_000}
        badge={
          <View style={styles.liveBar}>
            <View style={styles.liveDot} />
            <Text style={styles.liveText}>Updates every 10s</Text>
          </View>
        }
      />
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  liveBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 20,
    paddingVertical: 8,
    backgroundColor: 'rgba(34,197,94,0.08)',
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  liveDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: colors.accent },
  liveText: { fontSize: 12, fontWeight: '600', color: colors.accent },
})
