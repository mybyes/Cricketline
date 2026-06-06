import { SafeAreaView } from 'react-native-safe-area-context'
import { StyleSheet } from 'react-native'
import { MatchList } from '../components/MatchList'
import { fetchLiveMatches } from '../lib/api'
import { colors } from '../theme/colors'

export function HomeScreen() {
  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <MatchList
        headerTitle="CricketFast"
        headerSubtitle="Live cricket line"
        emptyText="No live matches right now"
        fetcher={fetchLiveMatches}
        pollMs={30_000}
      />
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({ safe: { flex: 1, backgroundColor: colors.bg } })
