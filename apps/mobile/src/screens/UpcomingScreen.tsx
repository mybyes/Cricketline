import { SafeAreaView } from 'react-native-safe-area-context'
import { StyleSheet } from 'react-native'
import { MatchList } from '../components/MatchList'
import { fetchUpcomingMatches } from '../lib/api'
import { colors } from '../theme/colors'

export function UpcomingScreen() {
  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <MatchList
        headerTitle="Fixtures"
        headerSubtitle="Upcoming matches"
        emptyText="No upcoming matches"
        fetcher={fetchUpcomingMatches}
        pollMs={120_000}
        showDate
      />
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
})
