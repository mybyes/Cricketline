import { StyleSheet, Text, View } from 'react-native'
import { colors } from '../theme/colors'

export function LiveBadge({ ended }: { ended?: boolean }) {
  if (ended) {
    return (
      <View style={[styles.badge, styles.ended]}>
        <Text style={[styles.text, styles.endedText]}>RESULT</Text>
      </View>
    )
  }
  return (
    <View style={[styles.badge, styles.live]}>
      <View style={styles.dot} />
      <Text style={styles.text}>LIVE</Text>
    </View>
  )
}

const styles = StyleSheet.create({
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    gap: 5,
  },
  live: { backgroundColor: 'rgba(239,68,68,0.15)' },
  ended: { backgroundColor: 'rgba(100,116,139,0.2)' },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.live,
  },
  text: {
    fontSize: 10,
    fontWeight: '800',
    color: colors.live,
    letterSpacing: 0.8,
  },
  endedText: { color: colors.textDim },
})
