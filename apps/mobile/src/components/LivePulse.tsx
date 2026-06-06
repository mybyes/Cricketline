import { useEffect, useRef } from 'react'
import { Animated, StyleSheet, View } from 'react-native'
import { colors } from '../theme/colors'

export function LivePulse({ size = 8 }: { size?: number }) {
  const anim = useRef(new Animated.Value(1)).current

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(anim, { toValue: 0.35, duration: 700, useNativeDriver: true }),
        Animated.timing(anim, { toValue: 1, duration: 700, useNativeDriver: true }),
      ]),
    )
    loop.start()
    return () => loop.stop()
  }, [anim])

  return (
    <View style={[styles.wrap, { width: size, height: size }]}>
      <Animated.View style={[styles.dot, { width: size, height: size, borderRadius: size / 2, opacity: anim }]} />
    </View>
  )
}

const styles = StyleSheet.create({
  wrap: { justifyContent: 'center', alignItems: 'center' },
  dot: { backgroundColor: colors.live },
})
