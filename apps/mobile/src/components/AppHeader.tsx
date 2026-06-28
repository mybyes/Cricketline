import { StyleSheet, Text, View } from 'react-native'
import { colors } from '../theme/colors'

export function AppHeader({ title, subtitle, right }: { title: string; subtitle?: string; right?: React.ReactNode }) {
  return (
    <View style={styles.header}>
      <View style={styles.brandRow}>
        <View style={styles.logoBox}><Text style={styles.logoText}>LG</Text></View>
        <View style={styles.titles}>
          <Text style={styles.title}>{title}</Text>
          {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
        </View>
      </View>
      {right}
    </View>
  )
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    backgroundColor: colors.header, paddingHorizontal: 16, paddingVertical: 14,
  },
  brandRow: { flexDirection: 'row', alignItems: 'center', gap: 12, flex: 1 },
  logoBox: { width: 36, height: 36, borderRadius: 8, backgroundColor: 'rgba(255,255,255,0.2)', alignItems: 'center', justifyContent: 'center' },
  logoText: { color: colors.textOnGreen, fontWeight: '900', fontSize: 14 },
  titles: { flex: 1 },
  title: { fontSize: 18, fontWeight: '800', color: colors.textOnGreen },
  subtitle: { fontSize: 12, color: 'rgba(255,255,255,0.75)', marginTop: 1 },
})
