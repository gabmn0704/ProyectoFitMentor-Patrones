import type { ReactNode } from 'react'
import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native'
import { colors, radii } from '../theme'
import { Text } from './Text'

type CardProps = { children: ReactNode; style?: StyleProp<ViewStyle>; tone?: 'surface' | 'field' | 'cobalt' | 'signal' }

const tones = {
  surface: { backgroundColor: colors.surface, borderColor: colors.line },
  field: { backgroundColor: colors.field, borderColor: colors.line },
  cobalt: { backgroundColor: colors.cobaltWash, borderColor: 'rgba(25,227,161,0.35)' },
  signal: { backgroundColor: colors.signalWash, borderColor: 'rgba(212,255,58,0.35)' },
}

export function Card({ children, style, tone = 'surface' }: CardProps) {
  return <View style={[styles.card, tones[tone], style]}>{children}</View>
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

/** Dorsal: banda de color con agujero, línea de corte punteada y numeral grande. */
export function BibTile({ label, value, suffix, foot, band = 'cobalt', style }: BibProps) {
  const bandColor = band === 'cobalt' ? colors.cobalt : band === 'signal' ? colors.vermilion : colors.surfaceHigh
  return (
    <View style={[styles.bib, style]} accessible accessibilityLabel={`${label}: ${value}${suffix ?? ''}${foot ? `. ${foot}` : ''}`}>
      <View style={[styles.band, { backgroundColor: bandColor }]}>
        <View style={styles.hole} />
        <Text variant="label" color={band === 'ink' ? colors.textMuted : colors.onCobalt} numberOfLines={1} style={styles.bandText}>
          {label}
        </Text>
      </View>
      <View style={styles.tear} />
      <View style={styles.bibBody}>
        <Text variant="numeral" style={styles.bibValue} numberOfLines={1} adjustsFontSizeToFit>
          {value}
          {suffix ? <Text variant="title" color={colors.textMuted}>{` ${suffix}`}</Text> : null}
        </Text>
        {foot ? (
          <Text variant="small" color={colors.textSubtle} numberOfLines={1}>
            {foot}
          </Text>
        ) : null}
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  card: { borderRadius: radii.lg, borderWidth: 1, padding: 20 },
  bib: { flex: 1, backgroundColor: colors.surface, borderRadius: radii.lg, borderWidth: 1, borderColor: colors.line, overflow: 'hidden' },
  band: { height: 34, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, gap: 8 },
  hole: { width: 10, height: 10, borderRadius: 5, backgroundColor: colors.bg },
  bandText: { flex: 1 },
  tear: { borderTopWidth: 2, borderStyle: 'dashed', borderColor: colors.lineStrong },
  bibBody: { paddingHorizontal: 14, paddingTop: 10, paddingBottom: 12, gap: 2 },
  bibValue: { fontSize: 38, lineHeight: 42 },
})
