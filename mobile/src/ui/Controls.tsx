import { useState, type ReactNode } from 'react'
import { StyleSheet, TextInput, View, type StyleProp, type TextInputProps, type ViewStyle } from 'react-native'
import Animated, { useAnimatedStyle, withSpring } from 'react-native-reanimated'
import { colors, fonts, hit, radii } from '../theme'
import { Pressable } from './Pressable'
import { Text } from './Text'

type ChipProps = { label: string; selected?: boolean; onPress?: () => void; icon?: ReactNode; style?: StyleProp<ViewStyle> }

/** Chip seleccionable (ejercicio, objetivo…). Cobalto = elegido. */
export function Chip({ label, selected, onPress, icon, style }: ChipProps) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityState={{ selected: Boolean(selected) }}
      style={[styles.chip, selected ? styles.chipOn : styles.chipOff, style]}
    >
      {icon}
      <Text variant="small" color={selected ? colors.onCobalt : colors.textMuted} style={{ fontFamily: fonts.bodySemi }}>
        {label}
      </Text>
    </Pressable>
  )
}

type SegmentedProps<T extends string> = { options: ReadonlyArray<{ value: T; label: string }>; value: T; onChange: (value: T) => void }

/** Control segmentado con pastilla cobalto deslizante. */
export function Segmented<T extends string>({ options, value, onChange }: SegmentedProps<T>) {
  const [width, setWidth] = useState(0)
  const index = Math.max(0, options.findIndex((option) => option.value === value))
  const segment = width / options.length
  const thumb = useAnimatedStyle(() => ({ transform: [{ translateX: withSpring(index * segment, { damping: 20, stiffness: 260 }) }] }))
  return (
    <View style={styles.segmented} onLayout={(event) => setWidth(event.nativeEvent.layout.width - 8)} accessibilityRole="tablist">
      {width > 0 ? <Animated.View style={[styles.thumb, { width: segment }, thumb]} /> : null}
      {options.map((option) => (
        <Pressable
          key={option.value}
          onPress={() => onChange(option.value)}
          pressScale={0.98}
          accessibilityRole="tab"
          accessibilityState={{ selected: option.value === value }}
          style={styles.segment}
        >
          <Text variant="small" color={option.value === value ? colors.onCobalt : colors.textMuted} style={{ fontFamily: fonts.bodySemi }}>
            {option.label}
          </Text>
        </Pressable>
      ))}
    </View>
  )
}

type FieldProps = TextInputProps & { label: string; error?: string; right?: ReactNode }

/** Campo de texto de 48 dp con etiqueta, foco cobalto y mensaje de error. */
export function Field({ label, error, right, style, ...rest }: FieldProps) {
  const [focused, setFocused] = useState(false)
  return (
    <View style={styles.field}>
      <Text variant="small" color={colors.textMuted} style={{ fontFamily: fonts.bodySemi }}>
        {label}
      </Text>
      <View style={[styles.inputWrap, focused && styles.inputFocus, Boolean(error) && styles.inputError]}>
        <TextInput
          accessibilityLabel={label}
          placeholderTextColor={colors.textSubtle}
          selectionColor={colors.cobaltText}
          cursorColor={colors.lime}
          {...rest}
          onFocus={(event) => {
            setFocused(true)
            rest.onFocus?.(event)
          }}
          onBlur={(event) => {
            setFocused(false)
            rest.onBlur?.(event)
          }}
          style={[styles.input, style]}
        />
        {right}
      </View>
      {error ? (
        <Text variant="small" color={colors.dangerText} accessibilityLiveRegion="polite">
          {error}
        </Text>
      ) : null}
    </View>
  )
}

const styles = StyleSheet.create({
  chip: { minHeight: 40, paddingHorizontal: 14, borderRadius: radii.sm, borderWidth: 1, flexDirection: 'row', alignItems: 'center', gap: 6 },
  chipOn: { backgroundColor: colors.cobalt, borderColor: colors.cobalt },
  chipOff: { backgroundColor: colors.surface, borderColor: colors.lineStrong },
  segmented: { flexDirection: 'row', backgroundColor: colors.surface, borderRadius: radii.md, padding: 4, borderWidth: 1, borderColor: colors.line },
  thumb: { position: 'absolute', top: 4, bottom: 4, left: 4, backgroundColor: colors.cobalt, borderRadius: radii.sm },
  segment: { flex: 1, minHeight: 40, alignItems: 'center', justifyContent: 'center' },
  field: { gap: 6 },
  inputWrap: {
    minHeight: hit,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: radii.md,
    borderWidth: 1.5,
    borderColor: colors.lineStrong,
    paddingHorizontal: 14,
  },
  inputFocus: { borderColor: colors.cobaltText, backgroundColor: colors.surfaceHigh },
  inputError: { borderColor: colors.danger },
  input: { flex: 1, color: colors.text, fontFamily: fonts.body, fontSize: 16, paddingVertical: 10 },
})
