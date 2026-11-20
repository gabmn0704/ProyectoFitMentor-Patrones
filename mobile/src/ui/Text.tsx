import type { ReactNode } from 'react'
import { Text as RNText, type StyleProp, type TextProps, type TextStyle } from 'react-native'
import { colors, fonts } from '../theme'

export type TextVariant = 'display' | 'headline' | 'title' | 'numeral' | 'body' | 'bodyStrong' | 'small' | 'label'

const variants: Record<TextVariant, TextStyle> = {
  display: { fontFamily: fonts.display, fontSize: 44, lineHeight: 46, letterSpacing: -1.2 },
  headline: { fontFamily: fonts.display, fontSize: 32, lineHeight: 35, letterSpacing: -0.8 },
  title: { fontFamily: fonts.displayBold, fontSize: 21, lineHeight: 25, letterSpacing: -0.3 },
  numeral: { fontFamily: fonts.display, fontSize: 44, lineHeight: 48, letterSpacing: -1, fontVariant: ['tabular-nums'] },
  body: { fontFamily: fonts.body, fontSize: 16, lineHeight: 24 },
  bodyStrong: { fontFamily: fonts.bodySemi, fontSize: 16, lineHeight: 24 },
  small: { fontFamily: fonts.body, fontSize: 14, lineHeight: 20 },
  label: { fontFamily: fonts.bodyBold, fontSize: 12, lineHeight: 16, letterSpacing: 1.1, textTransform: 'uppercase' },
}

type Props = TextProps & {
  variant?: TextVariant
  color?: string
  style?: StyleProp<TextStyle>
  children?: ReactNode
}

/** Texto base: la tipografía vive aquí, nunca en pantallas sueltas. Respeta el tamaño de fuente del sistema. */
export function Text({ variant = 'body', color = colors.text, style, ...rest }: Props) {
  return <RNText maxFontSizeMultiplier={1.4} {...rest} style={[variants[variant], { color }, style]} />
}
