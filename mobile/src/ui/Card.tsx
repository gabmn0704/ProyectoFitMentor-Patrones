import type { ReactNode } from 'react'
import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native'
import { colors, radii } from '../theme'
import { GradientFill } from './Gradient'
import { Text } from './Text'

type CardProps = { children: ReactNode; style?: StyleProp<ViewStyle>; tone?: 'surface' | 'field' | 'cobalt' | 'signal' }

const tones = {
  surface: { backgroundColor: colors.surface, borderColor: colors.line },
  field: { backgroundColor: colors.field, borderColor: colors.line },
  cobalt: { backgroundColor: colors.cobaltWash, borderColor: 'rgba(25,227,161,0.35)' },
  signal: { backgroundColor: colors.signalWash, borderColor: 'rgba(212,255,58,0.35)' },
}

const washes: Record<NonNullable<CardProps['tone']>, Array<[number, string, number]>> = {
  surface: [[0, '#1c2c25', 1], [1, '#0d1612', 1]],
  field: [[0, '#14201a', 1], [1, '#0a110e', 1]],
  cobalt: [[0, '#19e3a1', 0.26], [1, '#0a110e', 1]],
  signal: [[0, '#d4ff3a', 0.22], [1, '#0a110e', 1]],
}

/** Tarjeta con degradado diagonal, borde luminoso y sombra de color: se siente de cristal, no una caja. */
export function Card({ children, style, tone = 'surface' }: CardProps) {
  const glow = tone === 'signal' ? colors.lime : tone === 'cobalt' ? colors.mint : '#000'
  return (
    <View style={[styles.card, tones[tone], { shadowColor: glow }, style]}>
      <GradientFill stops={washes[tone]} />
      {children}
    </View>
  )
}

type BibProps = {
  label: string
  value: string | number
  suffix?: string
  foot?: string
  /** Alterna banda cobalto / tinta como en la web. */
  band?: 'cobalt' | 'ink' | 'signal'
  style?: StyleProp<ViewStyle>
}

/** Cifra destacada: tarjeta con degradado y número grande. `band` elige el color de acento. */
export function BibTile({ label, value, suffix, foot, band = 'cobalt', style }: BibProps) {
  const accent = band === 'signal' ? colors.lime : band === 'ink' ? colors.textMuted : colors.mint
  const wash: Array<[number, string, number]> = band === 'ink' ? [[0, '#1c2c25', 1], [1, '#0d1612', 1]] : [[0, accent, 0.24], [1, '#0a110e', 1]]
  return (
    <View style={[styles.bib, { shadowColor: accent }, style]} accessible accessibilityLabel={`${label}: ${value}${suffix ?? ''}${foot ? `. ${foot}` : ''}`}>
      <GradientFill stops={wash} />
      <View style={styles.bibHead}>
        <View style={[styles.bibDot, { backgroundColor: accent }]} />
        <Text variant="label" color={colors.textMuted} numberOfLines={1} style={styles.bandText}>
          {label}
        </Text>
      </View>
      <Text variant="numeral" style={styles.bibValue} numberOfLines={1} adjustsFontSizeToFit color={band === 'ink' ? colors.text : accent}>
        {value}
        {suffix ? <Text variant="title" color={colors.textMuted}>{` ${suffix}`}</Text> : null}
      </Text>
      {foot ? (
        <Text variant="small" color={colors.textSubtle} numberOfLines={1}>
          {foot}
        </Text>
      ) : null}
    </View>
  )
}

const styles = StyleSheet.create({
  card: { borderRadius: radii.xl, borderWidth: 1, padding: 20, overflow: 'hidden', shadowOpacity: 0.28, shadowRadius: 18, shadowOffset: { width: 0, height: 8 }, elevation: 6 },
  bib: { flex: 1, borderRadius: radii.xl, borderWidth: 1, borderColor: colors.lineStrong, overflow: 'hidden', padding: 16, gap: 6, shadowOpacity: 0.3, shadowRadius: 16, shadowOffset: { width: 0, height: 6 }, elevation: 5 },
  bibHead: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  bibDot: { width: 8, height: 8, borderRadius: 4 },
  bandText: { flex: 1 },
  bibValue: { fontSize: 42, lineHeight: 46 },
})
