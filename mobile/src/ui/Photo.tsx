import type { ReactNode } from 'react'
import { ImageBackground, type ImageSourcePropType, StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native'
import Svg, { Defs, LinearGradient, Rect, Stop } from 'react-native-svg'
import { radii } from '../theme'

export const photos = {
  core: require('../../assets/photos/core.jpg') as ImageSourcePropType,
  deadlift: require('../../assets/photos/deadlift.jpg') as ImageSourcePropType,
  gym: require('../../assets/photos/gym.jpg') as ImageSourcePropType,
  ropes: require('../../assets/photos/ropes.jpg') as ImageSourcePropType,
  studio: require('../../assets/photos/studio.jpg') as ImageSourcePropType,
}

export type PhotoName = keyof typeof photos

type Props = {
  name: PhotoName
  /** Opacidad del oscurecido inferior (0..1). */
  shade?: number
  radius?: number
  children?: ReactNode
  style?: StyleProp<ViewStyle>
}

/** Fondo fotográfico con degradado oscuro (esmeralda arriba, tinta abajo) para que el texto siempre se lea. */
export function Photo({ name, shade = 0.88, radius = radii.xl, children, style }: Props) {
  return (
    <ImageBackground source={photos[name]} resizeMode="cover" style={[styles.root, { borderRadius: radius }, style]} imageStyle={{ borderRadius: radius }}>
      <Svg style={StyleSheet.absoluteFill} pointerEvents="none">
        <Defs>
          <LinearGradient id="fm-shade" x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0" stopColor="#0A0E13" stopOpacity={0.35} />
            <Stop offset="0.55" stopColor="#0A0E13" stopOpacity={shade * 0.7} />
            <Stop offset="1" stopColor="#0A0E13" stopOpacity={shade} />
          </LinearGradient>
          <LinearGradient id="fm-tint" x1="0" y1="0" x2="1" y2="1">
            <Stop offset="0" stopColor="#19E3A1" stopOpacity={0.22} />
            <Stop offset="1" stopColor="#19E3A1" stopOpacity={0} />
          </LinearGradient>
        </Defs>
        <Rect width="100%" height="100%" fill="url(#fm-tint)" />
        <Rect width="100%" height="100%" fill="url(#fm-shade)" />
      </Svg>
      <View style={styles.content}>{children}</View>
    </ImageBackground>
  )
}

const styles = StyleSheet.create({
  root: { overflow: 'hidden', backgroundColor: '#0A0E13' },
  content: { flex: 1 },
})
