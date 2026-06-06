import { StyleSheet, Text, View } from 'react-native'
import { colors } from '../theme/colors'

export function LiveBadge({ ended, started }: { ended?: boolean; started?: boolean }) {
  if (ended) return <View style={[styles.badge, styles.result]}><Text style={styles.resultText}>RESULT</Text></View>
  if (!started) return <View style={[styles.badge, styles.upcoming]}><Text style={styles.upcomingText}>UPCOMING</Text></View>
  return (
    <View style={[styles.badge, styles.live]}>
      <View style={styles.dot} />
      <Text style={styles.liveText}>LIVE</Text>
    </View>
  )
}

const styles = StyleSheet.create({
  badge: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 4, gap: 5 },
  live: { backgroundColor: colors.live },
  dot: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#fff' },
  liveText: { fontSize: 9, fontWeight: '900', color: '#fff', letterSpacing: 0.8 },
  upcoming: { backgroundColor: colors.blue },
  upcomingText: { fontSize: 9, fontWeight: '800', color: '#fff' },
  result: { backgroundColor: colors.textDim },
  resultText: { fontSize: 9, fontWeight: '800', color: '#fff' },
})
