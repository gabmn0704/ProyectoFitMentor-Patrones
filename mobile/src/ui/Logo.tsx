import Svg, { Defs, G, LinearGradient, Path, Rect, Stop } from 'react-native-svg'

type Props = { size?: number; tile?: boolean }

/** Logotipo oficial de FitMentor (assets/brand/logo.svg): F con flecha de progreso, degradado menta a lima. */
export function Logo({ size = 40, tile = true }: Props) {
  return (
    <Svg width={size} height={size} viewBox="0 0 512 512" accessibilityLabel="FitMentor" accessibilityRole="image">
      <Defs>
        <LinearGradient id="fm-g" x1="130" y1="410" x2="390" y2="110" gradientUnits="userSpaceOnUse">
          <Stop offset="0" stopColor="#19E3A1" />
          <Stop offset="1" stopColor="#D4FF3A" />
        </LinearGradient>
      </Defs>
      {tile ? <Rect width={512} height={512} rx={116} fill="#0A0E13" /> : null}
      <G
        transform="translate(256 258) scale(1.1) translate(-281 -260)"
        fill="url(#fm-g)"
        stroke="url(#fm-g)"
        strokeWidth={24}
        strokeLinejoin="round"
      >
        <Path d="M160 392V128h222l-40 64H224v52h74l-40 64h-34v84z" />
        <Path d="M308 392l50-80 50 80z" />
      </G>
    </Svg>
  )
}
