/**
 * Tokens del tema oscuro de FitMentor. Misma familia que la web de la marca nueva:
 * campo verde-negro, menta para datos y selección, lima como acción principal.
 * Los nombres `cobalt*` y `vermilion`/`signal*` se conservan por compatibilidad: ahora son menta y lima.
 * Los errores usan `danger*` (rosa rojizo), nunca lima.
 */
export const colors = {
  bg: '#050a08',
  field: '#0a110e',
  surface: '#0f1814',
  surfaceHigh: '#16231d',
  line: 'rgba(236,255,246,0.10)',
  lineStrong: 'rgba(236,255,246,0.24)',
  text: '#f1f8f4',
  textMuted: '#b2c2ba',
  textSubtle: '#86978f',
  cobalt: '#19e3a1',
  cobaltText: '#7df0c0',
  cobaltWash: 'rgba(25,227,161,0.16)',
  onCobalt: '#04140e',
  vermilion: '#d4ff3a',
  signalText: '#e6ff7a',
  signalWash: 'rgba(212,255,58,0.12)',
  danger: '#ff4d6a',
  dangerText: '#ff8da0',
  dangerWash: 'rgba(255,77,106,0.14)',
  good: '#56d596',
  goodWash: 'rgba(86,213,150,0.14)',
  mint: '#19E3A1',
  lime: '#D4FF3A',
  scrim: 'rgba(5,10,8,0.72)',
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
