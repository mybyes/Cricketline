import { StyleSheet, Text, View } from 'react-native'
import { colors } from '../theme/colors'

export function AppHeader({ title, subtitle, right }: { title: string; subtitle?: string; right?: React.ReactNode }) {
  return (
    <View style={styles.header}>
      <View style={styles.brandRow}>
        <View style={styles.logoBox}><Text style={styles.logoText}>CP</Text></View>
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
    borderBottomWidth: 1, borderBottomColor: 'rgba(240,162,2,0.28)',
  },
  brandRow: { flexDirection: 'row', alignItems: 'center', gap: 12, flex: 1 },
  logoBox: {
    width: 38, height: 38, borderRadius: 4,
    borderWidth: 1.5, borderColor: colors.accent,
    alignItems: 'center', justifyContent: 'center',
  },
  logoText: { color: colors.accent, fontWeight: '800', fontSize: 13, letterSpacing: -0.5 },
  titles: { flex: 1 },
  title: { fontSize: 19, fontWeight: '800', color: colors.textOnGreen, letterSpacing: -0.4 },
  subtitle: {
    fontSize: 10, color: 'rgba(240,162,2,0.9)', marginTop: 2,
    fontWeight: '700', letterSpacing: 0.8, textTransform: 'uppercase',
  },
})
