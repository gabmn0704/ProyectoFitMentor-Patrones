import { useEffect, useState } from 'react'
import { StyleSheet, View } from 'react-native'
import Animated, { Easing, runOnJS, useAnimatedStyle, useSharedValue, withDelay, withSequence, withSpring, withTiming } from 'react-native-reanimated'
import { colors } from '../theme'
import { Logo } from './Logo'
import { Text } from './Text'

const HOLD_MS = 1500

/**
 * Intro animada al abrir la app: el logo entra con rebote, brilla un halo esmeralda y el nombre sube.
 * Va por encima de la app (que ya carga debajo), no bloquea el arranque y se retira sola.
 */
export function IntroSplash() {
  const [visible, setVisible] = useState(true)
  const logo = useSharedValue(0)
  const halo = useSharedValue(0)
  const title = useSharedValue(0)
  const overlay = useSharedValue(1)

  useEffect(() => {
    logo.value = withSpring(1, { damping: 9, stiffness: 120, mass: 0.8 })
    halo.value = withSequence(withTiming(1, { duration: 700, easing: Easing.out(Easing.cubic) }), withTiming(0.55, { duration: 500 }))
    title.value = withDelay(350, withTiming(1, { duration: 550, easing: Easing.out(Easing.cubic) }))
    overlay.value = withDelay(HOLD_MS, withTiming(0, { duration: 420 }, (finished) => {
      if (finished) runOnJS(setVisible)(false)
    }))
  }, [halo, logo, overlay, title])

  const overlayStyle = useAnimatedStyle(() => ({ opacity: overlay.value }))
  const logoStyle = useAnimatedStyle(() => ({ opacity: logo.value, transform: [{ scale: 0.4 + 0.6 * logo.value }, { rotate: `${(1 - logo.value) * -14}deg` }] }))
  const haloStyle = useAnimatedStyle(() => ({ opacity: halo.value * 0.55, transform: [{ scale: 0.6 + halo.value * 0.9 }] }))
  const titleStyle = useAnimatedStyle(() => ({ opacity: title.value, transform: [{ translateY: (1 - title.value) * 16 }] }))

  if (!visible) return null
  return (
    <Animated.View style={[styles.root, overlayStyle]} pointerEvents="auto">
      <View style={styles.center}>
        <Animated.View style={[styles.halo, haloStyle]} />
        <Animated.View style={logoStyle}>
          <Logo size={112} />
        </Animated.View>
        <Animated.View style={titleStyle}>
          <Text variant="headline" style={styles.title}>FitMentor</Text>
        </Animated.View>
      </View>
    </Animated.View>
  )
}

const styles = StyleSheet.create({
  root: { ...StyleSheet.absoluteFill as object, backgroundColor: '#0A0E13', alignItems: 'center', justifyContent: 'center', zIndex: 100 },
  center: { alignItems: 'center', gap: 22 },
  halo: { position: 'absolute', top: -34, width: 180, height: 180, borderRadius: 90, backgroundColor: colors.mint },
  title: { letterSpacing: 0.5 },
})
