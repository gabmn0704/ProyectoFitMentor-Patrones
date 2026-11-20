import type { ReactNode } from 'react'
import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native'
import { colors, radii } from '../theme'
import { Mascot, type MascotState } from './Mascot'

type Props = {
  state?: MascotState
  message: string
  size?: number
  count?: number
  interactive?: boolean
  /** Contenido bajo Rep (cifras, acción). */
  children?: ReactNode
  style?: StyleProp<ViewStyle>
}

/** Cabecera de pantalla: Rep con un mensaje propio de la sección sobre un campo con brillo. */
export function PageHero({ state = 'idle', message, size = 104, count, interactive = true, children, style }: Props) {
  return (
    <View style={[styles.hero, style]}>
      <View style={styles.glow} pointerEvents="none" />
      <Mascot state={state} size={size} message={message} count={count} placement="right" interactive={interactive} style={styles.rep} />
      {children}
    </View>
  )
}

const styles = StyleSheet.create({
  hero: { backgroundColor: colors.field, borderRadius: radii.xl, borderWidth: 1, borderColor: colors.line, padding: 16, gap: 14, overflow: 'hidden' },
  glow: { position: 'absolute', top: -60, left: -40, width: 200, height: 200, borderRadius: 100, backgroundColor: colors.cobaltWash },
  rep: { alignSelf: 'stretch' },
})
