import type { ReactNode } from 'react'
import { ActivityIndicator, StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native'
import { colors, hit, radii } from '../theme'
import { GradientFill } from './Gradient'
import { Pressable } from './Pressable'
import { Text } from './Text'

type Variant = 'primary' | 'cobalt' | 'ghost' | 'danger'

type Props = {
  label: string
  onPress?: () => void
  variant?: Variant
  icon?: ReactNode
  loading?: boolean
  disabled?: boolean
  large?: boolean
  style?: StyleProp<ViewStyle>
  accessibilityHint?: string
}

const palette: Record<Variant, { bg: string; fg: string; border?: string }> = {
  primary: { bg: colors.vermilion, fg: '#0a0c12' },
  cobalt: { bg: colors.cobalt, fg: colors.onCobalt },
  ghost: { bg: 'transparent', fg: colors.text, border: colors.lineStrong },
  danger: { bg: 'transparent', fg: colors.dangerText, border: colors.danger },
}

/** Botón táctil de 48 dp (58 dp en grande). Bermellón = la acción principal. */
export function Button({ label, onPress, variant = 'primary', icon, loading, disabled, large, style, accessibilityHint }: Props) {
  const tone = palette[variant]
  const inactive = disabled || loading
  return (
    <Pressable
      onPress={inactive ? undefined : onPress}
      accessibilityLabel={label}
      accessibilityHint={accessibilityHint}
      accessibilityState={{ disabled: Boolean(inactive), busy: Boolean(loading) }}
      style={[
        styles.base,
        { backgroundColor: tone.bg, minHeight: large ? 60 : hit, borderColor: tone.border ?? 'transparent', opacity: inactive ? 0.5 : 1 },
        variant === 'primary' && !inactive && styles.glow,
        style,
      ]}
    >
      {variant === 'primary' ? <GradientFill stops={[[0, '#19e3a1'], [1, '#d4ff3a']]} /> : null}
      {loading ? (
        <ActivityIndicator color={tone.fg} />
      ) : (
        <View style={styles.row}>
          {icon}
          <Text variant="bodyStrong" color={tone.fg} style={{ fontSize: large ? 17 : 15 }}>
            {label}
          </Text>
        </View>
      )}
    </Pressable>
  )
}

const styles = StyleSheet.create({
  base: { borderRadius: radii.pill, borderWidth: 1.5, paddingHorizontal: 28, alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
  glow: { shadowColor: '#19e3a1', shadowOpacity: 0.55, shadowRadius: 16, shadowOffset: { width: 0, height: 6 }, elevation: 10 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 10 },
})
