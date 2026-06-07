import { Pressable, StyleSheet, Text, View } from 'react-native'
import { colors } from '../theme/colors'

export function FeedPausedCard({ onRetry }: { onRetry: () => void }) {
  return (
    <View style={styles.card}>
      <Text style={styles.title}>No scores loaded yet</Text>
      <Text style={styles.body}>
        Pull down to refresh, or star a few matches so they stay here next time.
      </Text>
      <Pressable onPress={onRetry} style={styles.btn} accessibilityRole="button" accessibilityLabel="Retry loading scores">
        <Text style={styles.btnText}>Retry</Text>
      </Pressable>
    </View>
  )
}

const styles = StyleSheet.create({
  card: {
    marginHorizontal: 16,
    marginTop: 12,
    marginBottom: 4,
    backgroundColor: colors.card,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 16,
  },
  title: { fontSize: 15, fontWeight: '800', color: colors.text, marginBottom: 8 },
  body: { fontSize: 13, color: colors.textMuted, lineHeight: 20, marginBottom: 14 },
  btn: {
    alignSelf: 'flex-start',
    backgroundColor: colors.header,
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 8,
  },
  btnText: { color: '#fff', fontWeight: '700', fontSize: 14 },
})
