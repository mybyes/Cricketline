import { StyleSheet, Text, View } from 'react-native'

export function StaleBanner({ message }: { message?: string }) {
  return (
    <View style={styles.bar}>
      <Text style={styles.text}>{message ?? 'Showing saved scores'}</Text>
    </View>
  )
}

const styles = StyleSheet.create({
  bar: {
    backgroundColor: '#f5f7f5',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e4e0',
    paddingVertical: 7,
    paddingHorizontal: 14,
  },
  text: { fontSize: 11, fontWeight: '600', color: '#5c6b5c' },
})
