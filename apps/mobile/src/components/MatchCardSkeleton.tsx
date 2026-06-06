import { StyleSheet, View } from 'react-native'
import { colors } from '../theme/colors'

export function MatchCardSkeleton() {
  return (
    <View style={styles.card}>
      <View style={[styles.line, { width: '30%' }]} />
      <View style={[styles.line, { width: '70%', marginTop: 12 }]} />
      <View style={styles.row}>
        <View style={[styles.line, { flex: 1 }]} />
        <View style={[styles.line, { flex: 1 }]} />
      </View>
      <View style={[styles.line, { width: '90%', marginTop: 8 }]} />
    </View>
  )
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.card, marginHorizontal: 12, marginBottom: 10, borderRadius: 8,
    padding: 14, borderWidth: 1, borderColor: colors.border,
  },
  line: { height: 12, backgroundColor: colors.surfaceAlt, borderRadius: 4 },
  row: { flexDirection: 'row', gap: 12, marginTop: 12 },
})
