import type { ReactNode } from 'react'
import { Pressable as RNPressable, type PressableProps, type StyleProp, type ViewStyle } from 'react-native'
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated'
import { haptic } from './haptics'

const AnimatedPressable = Animated.createAnimatedComponent(RNPressable)

type Props = Omit<PressableProps, 'style' | 'children'> & {
  style?: StyleProp<ViewStyle>
  children?: ReactNode
  /** Escala al pulsar (0.97 por defecto, como el botón de la web). */
  pressScale?: number
  /** Háptica al tocar; desactívala en controles que ya vibran por otro motivo. */
  feedback?: boolean
}

/** Base de todo lo tocable: escala con muelle, háptica ligera y objetivo táctil. */
export function Pressable({ style, children, pressScale = 0.97, feedback = true, onPressIn, onPressOut, onPress, ...rest }: Props) {
  const scale = useSharedValue(1)
  const animated = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }))
  return (
    <AnimatedPressable
      accessibilityRole="button"
      hitSlop={6}
      {...rest}
      onPressIn={(event) => {
        scale.value = withSpring(pressScale, { damping: 18, stiffness: 420 })
        onPressIn?.(event)
      }}
      onPressOut={(event) => {
        scale.value = withSpring(1, { damping: 16, stiffness: 320 })
        onPressOut?.(event)
      }}
      onPress={(event) => {
        if (feedback) haptic.tap()
        onPress?.(event)
      }}
      style={[animated, style]}
    >
      {children}
    </AnimatedPressable>
  )
}
