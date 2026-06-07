import { Pressable, StyleSheet, Text, View } from 'react-native'
import { colors } from '../theme/colors'

export function FeedPausedCard({
  message,
  onRetry,
}: {
  message?: string
  onRetry: () => void
}) {
  const blocked = (message ?? '').toLowerCase().includes('block')
    || (message ?? '').toLowerCase().includes('15 min')

  return (
    <View style={styles.card}>
      <Text style={styles.title}>{blocked ? 'Live feed paused' : 'Could not refresh'}</Text>
      <Text style={styles.body}>
        {blocked
          ? 'CricAPI is temporarily rate-limited (~15 min). Your last scores and saved matches stay below — pull down or tap Retry to check again.'
          : (message ?? 'Network issue — showing whatever we have saved on this device.')}
      </Text>
      <Pressable onPress={onRetry} style={styles.btn} accessibilityRole="button" accessibilityLabel="Retry loading scores">
        <Text style={styles.btnText}>Retry now</Text>
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
    borderColor: '#ffe082',
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
