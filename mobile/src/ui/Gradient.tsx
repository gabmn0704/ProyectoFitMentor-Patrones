import { useId } from 'react'
import { StyleSheet } from 'react-native'
import Svg, { Defs, LinearGradient, RadialGradient, Rect, Stop } from 'react-native-svg'

type Stops = Array<[offset: number, color: string, opacity?: number]>

/** Relleno degradado lineal que cubre a su contenedor (sin dependencias nativas). */
export function GradientFill({ stops, from = [0, 0], to = [1, 1] }: { stops: Stops; from?: [number, number]; to?: [number, number] }) {
  const id = useId().replace(/[^a-zA-Z0-9]/g, '')
  return (
    <Svg style={StyleSheet.absoluteFill} pointerEvents="none">
      <Defs>
        <LinearGradient id={id} x1={from[0]} y1={from[1]} x2={to[0]} y2={to[1]}>
          {stops.map(([offset, color, opacity = 1]) => (
            <Stop key={offset} offset={offset} stopColor={color} stopOpacity={opacity} />
          ))}
        </LinearGradient>
      </Defs>
      <Rect width="100%" height="100%" fill={`url(#${id})`} />
    </Svg>
  )
}

/** Resplandor radial suave (para ambientar fondos y tarjetas). */
export function Glow({ color, size, opacity = 0.35, style }: { color: string; size: number; opacity?: number; style?: object }) {
  const id = useId().replace(/[^a-zA-Z0-9]/g, '')
  return (
    <Svg width={size} height={size} style={[{ position: 'absolute' }, style]} pointerEvents="none">
      <Defs>
        <RadialGradient id={id} cx="50%" cy="50%" r="50%">
          <Stop offset="0" stopColor={color} stopOpacity={opacity} />
          <Stop offset="1" stopColor={color} stopOpacity={0} />
        </RadialGradient>
      </Defs>
      <Rect width={size} height={size} fill={`url(#${id})`} />
    </Svg>
  )
}
