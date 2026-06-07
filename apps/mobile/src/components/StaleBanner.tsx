import { StyleSheet, Text, View } from 'react-native'
import { colors } from '../theme/colors'

export function StaleBanner({ message }: { message?: string }) {
  return (
    <View style={styles.bar}>
      <Text style={styles.dot}>●</Text>
      <Text style={styles.text}>
        {message ?? 'Cached scores — live feed temporarily limited. UI stays usable until refresh succeeds.'}
      </Text>
    </View>
  )
}

const styles = StyleSheet.create({
  bar: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    backgroundColor: '#fff8e1',
    borderBottomWidth: 1,
    borderBottomColor: '#ffe082',
    paddingVertical: 8,
    paddingHorizontal: 14,
  },
  dot: { color: '#f57f17', fontSize: 10, marginTop: 2 },
  text: { flex: 1, fontSize: 11, fontWeight: '600', color: '#6d4c00', lineHeight: 16 },
})
