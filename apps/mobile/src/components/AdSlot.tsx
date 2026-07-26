import { Linking, Pressable, StyleSheet, Text, View } from 'react-native'
import { colors } from '../theme/colors'

type Size = 'banner' | 'inline'

const AD_URL = 'https://x.com/ChaiPeCric'

/** House ad — chalk card, amber accent (not a black slab). */
export function AdSlot({
  size = 'banner',
  label = 'Advertisement',
}: {
  size?: Size
  label?: string
}) {
  return (
    <Pressable
      onPress={() => { void Linking.openURL(AD_URL) }}
      style={[styles.slot, size === 'inline' ? styles.inline : styles.banner]}
      accessibilityLabel="Advertisement"
      accessibilityRole="link"
    >
      <Text style={styles.kicker}>{label}</Text>
      <Text style={styles.handle}>@ChaiPeCric</Text>
      <Text style={styles.tag} numberOfLines={1}>Cricket banter — follow on X</Text>
      <View style={styles.cta}>
        <Text style={styles.ctaTxt}>Follow</Text>
      </View>
    </Pressable>
  )
}

const styles = StyleSheet.create({
  slot: {
    backgroundColor: colors.card,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    borderLeftWidth: 2,
    borderLeftColor: 'rgba(196,132,8,0.55)',
    marginHorizontal: 12,
    marginVertical: 8,
    borderRadius: 6,
    paddingHorizontal: 14,
    paddingVertical: 12,
    alignItems: 'flex-start',
    justifyContent: 'center',
  },
  banner: { minHeight: 68 },
  inline: { minHeight: 60 },
  kicker: {
    position: 'absolute',
    top: 6,
    right: 10,
    fontSize: 8,
    fontWeight: '700',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
    color: colors.textDim,
  },
  handle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 2,
    letterSpacing: -0.2,
  },
  tag: {
    fontSize: 12,
    fontWeight: '500',
    color: colors.textMuted,
    marginBottom: 8,
    paddingRight: 64,
  },
  cta: {
    backgroundColor: 'transparent',
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: colors.border,
    alignSelf: 'flex-start',
  },
  ctaTxt: { fontSize: 12, fontWeight: '700', color: colors.text },
})
