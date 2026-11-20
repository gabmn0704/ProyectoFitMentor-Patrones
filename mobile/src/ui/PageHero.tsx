import type { ReactNode } from 'react'
import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native'
import { colors } from '../theme'
import { Mascot, type MascotState } from './Mascot'
import { Photo, type PhotoName } from './Photo'

type Props = {
  state?: MascotState
  message: string
  size?: number
  count?: number
  interactive?: boolean
  /** Foto de fondo de la cabecera. */
  photo?: PhotoName
  /** Contenido bajo Rep (cifras, acción). */
  children?: ReactNode
  style?: StyleProp<ViewStyle>
}

/** Cabecera de pantalla: Rep con un mensaje propio de la sección sobre un campo con brillo. */
export function PageHero({ state = 'idle', message, size = 104, count, interactive = true, photo = 'studio', children, style }: Props) {
  return (
    <Photo name={photo} shade={0.9} style={[styles.frame, style]}>
      <View style={styles.hero}>
        <Mascot state={state} size={size} message={message} count={count} placement="right" interactive={interactive} style={styles.rep} />
        {children}
      </View>
    </Photo>
  )
}

const styles = StyleSheet.create({
  frame: { borderWidth: 1, borderColor: colors.line },
  hero: { padding: 16, gap: 14 },
  rep: { alignSelf: 'stretch' },
})
