/**
 * Tokens del tema oscuro de FitMentor. Misma familia que la web ("Race Day de noche"):
 * campo de tinta, cobalto para datos y selección, bermellón como señal de acción.
 * El verde menta del logotipo solo aparece en la marca y en estados de éxito.
 */
export const colors = {
  bg: '#05070c',
  field: '#0c111c',
  surface: '#111827',
  surfaceHigh: '#182034',
  line: 'rgba(244,246,251,0.10)',
  lineStrong: 'rgba(244,246,251,0.24)',
  text: '#f4f6fb',
  textMuted: '#b4bccd',
  textSubtle: '#8a93a6',
  cobalt: '#2a47ff',
  cobaltText: '#8a9dff',
  cobaltWash: 'rgba(42,71,255,0.18)',
  onCobalt: '#f6f8ff',
  vermilion: '#ff3d1f',
  signalText: '#ff7d66',
  signalWash: 'rgba(255,61,31,0.14)',
  good: '#56d596',
  goodWash: 'rgba(86,213,150,0.14)',
  mint: '#19E3A1',
  lime: '#D4FF3A',
  scrim: 'rgba(5,7,12,0.72)',
} as const

export const fonts = {
  display: 'Outfit_800ExtraBold',
  displayBold: 'Outfit_700Bold',
  displaySemi: 'Outfit_600SemiBold',
  body: 'Geist_400Regular',
  bodyMedium: 'Geist_500Medium',
  bodySemi: 'Geist_600SemiBold',
  bodyBold: 'Geist_700Bold',
} as const

export const radii = { xs: 4, sm: 8, md: 12, lg: 16, xl: 24, pill: 999 } as const

export const space = { 1: 4, 2: 8, 3: 12, 4: 16, 5: 24, 6: 32, 7: 48, 8: 72 } as const

/** Altura mínima táctil recomendada (48 dp). */
export const hit = 48
