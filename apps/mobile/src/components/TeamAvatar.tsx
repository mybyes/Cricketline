import { Image, StyleSheet, Text, View } from 'react-native'
import { teamColor } from '../theme/teamColors'

export function TeamAvatar({ shortname, logo, size = 32 }: { shortname?: string; logo?: string; size?: number }) {
  const bg = teamColor(shortname)
  const initial = (shortname ?? '?')[0]?.toUpperCase() ?? '?'

  if (logo) {
    return <Image source={{ uri: logo }} style={{ width: size, height: size, borderRadius: size / 2 }} />
  }

  return (
    <View style={[styles.circle, { width: size, height: size, borderRadius: size / 2, backgroundColor: bg }]}>
      <Text style={[styles.initial, { fontSize: size * 0.4 }]}>{initial}</Text>
    </View>
  )
}

const styles = StyleSheet.create({
  circle: { alignItems: 'center', justifyContent: 'center' },
  initial: { color: '#fff', fontWeight: '900' },
})
