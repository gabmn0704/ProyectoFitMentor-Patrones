import { useEffect, useId, useRef, useState } from 'react'
import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native'
import Animated, {
  Easing,
  FadeIn,
  cancelAnimation,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated'
import Svg, { Circle, ClipPath, Defs, Ellipse, G, LinearGradient, Path, RadialGradient, Rect, Stop, Text as SvgText } from 'react-native-svg'
import { MASCOT_LABELS, MASCOT_NAME, mascotPhrase, type MascotState } from '../lib/mascot'
import { colors, fonts, radii } from '../theme'
import { haptic } from './haptics'
import { Pressable } from './Pressable'
import { Text } from './Text'

export type { MascotState } from '../lib/mascot'

export interface MascotProps {
  /** Estado emocional: define cara, brazos y movimiento. */
  state?: MascotState
  /** Alto del personaje en dp. */
  size?: number
  /** Globo de texto. `true` rota frases del estado; un texto fija el mensaje. */
  message?: string | boolean
  /** Número que se muestra con el estado `count`. */
  count?: number
  /** Dónde va el globo respecto al personaje. */
  placement?: 'right' | 'left' | 'top'
  /** Al tocarlo salta y anima con una frase nueva. */
  interactive?: boolean
  style?: StyleProp<ViewStyle>
}

const INK = '#04140e'
const ROTATE_MS = 7000

interface Pose {
  lA: number
  lB: number
  rA: number
  rB: number
  lid: number
  brow: [number, number, number]
  look: [number, number]
  y: number
}

const POSES: Record<MascotState, Pose> = {
  idle: { lA: 16, lB: -18, rA: -14, rB: 26, lid: 0, brow: [0, 0, 0], look: [0, 0], y: 0 },
  wave: { lA: 14, lB: -16, rA: -146, rB: -14, lid: 0, brow: [0, -2, 0], look: [0.6, -0.4], y: 0 },
  cheer: { lA: 148, lB: -26, rA: -148, rB: 26, lid: 0, brow: [0, -3, 0], look: [0, 0], y: 0 },
  count: { lA: 22, lB: -60, rA: -16, rB: 120, lid: 0.12, brow: [0, 1, -9], look: [0.4, 0.2], y: 1 },
  rest: { lA: 8, lB: -4, rA: -8, rB: 4, lid: 0.86, brow: [0, 2, 4], look: [0, 1], y: 2 },
  celebrate: { lA: 158, lB: -12, rA: -158, rB: 12, lid: 0, brow: [0, -4, 0], look: [0, -0.5], y: 0 },
  worried: { lA: -26, lB: -52, rA: 26, rB: 52, lid: 0.22, brow: [0, -1, 16], look: [-0.5, 0.8], y: 0 },
}

const SPARKS: Array<[number, number]> = [
  [10, 42],
  [110, 38],
  [6, 80],
  [114, 78],
  [22, 16],
  [100, 12],
]

const BODY_PATH = 'M60 19C84 19 99 43 99 73C99 98 83 114 60 114C37 114 21 98 21 73C21 43 36 19 60 19Z'

/** Texto del globo: fijo o rotando frases del estado. */
function useMessage(state: MascotState, message: string | boolean | undefined, bump: number): string | null {
  const auto = message === true
  const [seed, setSeed] = useState(() => Math.floor(Math.random() * 1000))
  useEffect(() => {
    if (!auto) return
    setSeed((v) => v + 1)
    const id = setInterval(() => setSeed((v) => v + 1), ROTATE_MS)
    return () => clearInterval(id)
  }, [auto, state])
  if (typeof message === 'string') return message
  if (!auto) return null
  return mascotPhrase(state, seed + bump)
}

/** Movimiento del cuerpo entero por estado: respiración, salto, balanceo o temblor. */
function useBodyMotion(state: MascotState, reduced: boolean) {
  const lift = useSharedValue(0)
  const squash = useSharedValue(1)
  const tilt = useSharedValue(0)

  useEffect(() => {
    cancelAnimation(lift)
    cancelAnimation(squash)
    cancelAnimation(tilt)
    lift.value = 0
    squash.value = 1
    tilt.value = 0
    if (reduced) return
    const ease = Easing.inOut(Easing.sin)
    const bob = (to: number, ms: number) =>
      withRepeat(withSequence(withTiming(to, { duration: ms, easing: ease }), withTiming(0, { duration: ms, easing: ease })), -1)
    if (state === 'celebrate' || state === 'cheer') {
      const up = state === 'celebrate' ? -9 : -5
      lift.value = withRepeat(
        withSequence(
          withTiming(up, { duration: 260, easing: Easing.out(Easing.quad) }),
          withTiming(0, { duration: 260, easing: Easing.in(Easing.quad) }),
          withTiming(0, { duration: 160 }),
        ),
        -1,
      )
      squash.value = withRepeat(withSequence(withTiming(0.97, { duration: 260 }), withTiming(1.02, { duration: 260 }), withTiming(1, { duration: 160 })), -1)
    } else if (state === 'wave') {
      lift.value = bob(-2, 900)
      tilt.value = withRepeat(withSequence(withTiming(2.5, { duration: 520, easing: ease }), withTiming(-2.5, { duration: 520, easing: ease })), -1, true)
    } else if (state === 'worried') {
      tilt.value = withRepeat(withSequence(withTiming(1.8, { duration: 90 }), withTiming(-1.8, { duration: 90 }), withTiming(0, { duration: 700 })), -1)
    } else if (state === 'count') {
      lift.value = bob(-2.5, 480)
    } else if (state === 'rest') {
      squash.value = withRepeat(withSequence(withTiming(1.025, { duration: 2200, easing: ease }), withTiming(1, { duration: 2200, easing: ease })), -1)
    } else {
      lift.value = bob(-3, 1500)
      squash.value = withRepeat(withSequence(withTiming(1.018, { duration: 1500, easing: ease }), withTiming(1, { duration: 1500, easing: ease })), -1)
    }
    return () => {
      cancelAnimation(lift)
      cancelAnimation(squash)
      cancelAnimation(tilt)
    }
  }, [state, reduced, lift, squash, tilt])

  return useAnimatedStyle(() => ({
    transform: [{ translateY: lift.value }, { rotate: `${tilt.value}deg` }, { scaleY: squash.value }],
  }))
}

/** Cápsula de brazo o pierna: de (0,0) a (0,len). */
function Capsule({ len, w, fill }: { len: number; w: number; fill: string }) {
  return <Rect x={-w / 2} y={-w / 2} width={w} height={len + w} rx={w / 2} fill={fill} />
}

/**
 * Rep, la mascota de FitMentor, en SVG con react-native-svg. Mismo personaje que la web (esmeralda + cinta lima)
 * con los estados idle, wave, cheer, count, rest, celebrate y worried.
 *
 * Uso: `<Mascot state="wave" size={120} message="Hola" />`, `<Mascot message />` para frases rotativas,
 * `<Mascot state="count" count={reps} />` o `<Mascot interactive />` para que reaccione al toque.
 */
export function Mascot({ state = 'idle', size = 160, message, count, placement = 'right', interactive = false, style }: MascotProps) {
  const uid = useId().replace(/[^a-zA-Z0-9]/g, '')
  const id = (name: string) => `${uid}-${name}`
  const url = (name: string) => `url(#${uid}-${name})`
  const reduced = useReducedMotion()
  const [override, setOverride] = useState<MascotState | null>(null)
  const [bump, setBump] = useState(0)
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)
  const current = override ?? state
  const text = useMessage(current, message, bump)
  const pose = POSES[current]
  const bodyStyle = useBodyMotion(current, reduced)

  useEffect(() => () => clearTimeout(timer.current), [])

  const poke = () => {
    clearTimeout(timer.current)
    haptic.light()
    setOverride('cheer')
    setBump((v) => v + 1)
    timer.current = setTimeout(() => setOverride(null), 1600)
  }

  const happyEyes = current === 'cheer' || current === 'celebrate'
  const openMouth = current === 'wave' || current === 'cheer' || current === 'celebrate'
  const holdsBell = current === 'idle' || current === 'count'
  const label = `${MASCOT_NAME}, la mascota de FitMentor, ${MASCOT_LABELS[current]}`
  const width = (size * 120) / 142

  const eye = (cx: number) => (
    <G>
      <G clipPath={url(cx < 60 ? 'eye-l' : 'eye-r')}>
        <Ellipse cx={cx} cy={63} rx={8.4} ry={9.8} fill={url('sclera')} />
        <G x={pose.look[0] * 2} y={pose.look[1] * 2}>
          <Circle cx={cx + 0.6} cy={64} r={5.9} fill={url('iris')} />
          <Circle cx={cx + 0.6} cy={64} r={2.9} fill="#05061a" />
          <Circle cx={cx + 2.8} cy={61.4} r={1.9} fill="#fff" />
          <Circle cx={cx - 1.4} cy={66.4} r={0.85} fill="#fff" opacity={0.85} />
        </G>
        <G y={pose.lid * 19.6}>
          <Rect x={cx - 10} y={63 - 9.8 - 22} width={20} height={22} fill={url('lid')} />
          <Path d={`M${cx - 10} ${63 - 9.8} H${cx + 10}`} stroke={INK} strokeWidth={1.6} opacity={0.55} />
        </G>
      </G>
      {pose.lid < 0.5 ? <Ellipse cx={cx} cy={63} rx={8.4} ry={9.8} fill="none" stroke="#06573a" strokeOpacity={0.35} strokeWidth={1} /> : null}
    </G>
  )

  const figure = (
    <Animated.View style={bodyStyle}>
      <Svg width={width} height={size} viewBox="0 0 120 142" accessible accessibilityLabel={label}>
        <Defs>
          <RadialGradient id={id('body')} cx="0.36" cy="0.26" r="0.86">
            <Stop offset="0" stopColor="#8ff5cf" />
            <Stop offset="0.38" stopColor="#19e3a1" />
            <Stop offset="0.8" stopColor="#0fb27f" />
            <Stop offset="1" stopColor="#0a7a53" />
          </RadialGradient>
          <LinearGradient id={id('rim')} x1="0" y1="0" x2="1" y2="0.3">
            <Stop offset="0" stopColor="#6ff0b4" stopOpacity="0" />
            <Stop offset="0.7" stopColor="#7df0c0" stopOpacity="0.2" />
            <Stop offset="1" stopColor="#c3ffe0" />
          </LinearGradient>
          <RadialGradient id={id('ao')} cx="0.5" cy="1" r="0.75">
            <Stop offset="0" stopColor="#02261a" stopOpacity="0.75" />
            <Stop offset="1" stopColor="#02261a" stopOpacity="0" />
          </RadialGradient>
          <RadialGradient id={id('spec')} cx="0.5" cy="0.5" r="0.5">
            <Stop offset="0" stopColor="#fff" stopOpacity="0.85" />
            <Stop offset="1" stopColor="#fff" stopOpacity="0" />
          </RadialGradient>
          <LinearGradient id={id('limb')} x1="0" y1="0" x2="1" y2="0">
            <Stop offset="0" stopColor="#2ee8ae" />
            <Stop offset="1" stopColor="#0c8f63" />
          </LinearGradient>
          <LinearGradient id={id('leg')} x1="0" y1="0" x2="1" y2="0">
            <Stop offset="0" stopColor="#1b2e27" />
            <Stop offset="1" stopColor="#0a1612" />
          </LinearGradient>
          <RadialGradient id={id('glove')} cx="0.35" cy="0.3" r="0.8">
            <Stop offset="0" stopColor="#ffffff" />
            <Stop offset="1" stopColor="#cdeedd" />
          </RadialGradient>
          <LinearGradient id={id('band')} x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0" stopColor="#e6ff7a" />
            <Stop offset="0.5" stopColor="#d4ff3a" />
            <Stop offset="1" stopColor="#9bc21a" />
          </LinearGradient>
          <LinearGradient id={id('shoe')} x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0" stopColor="#dcff5a" />
            <Stop offset="1" stopColor="#a8d41a" />
          </LinearGradient>
          <LinearGradient id={id('sclera')} x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0" stopColor="#ffffff" />
            <Stop offset="1" stopColor="#d8f3e6" />
          </LinearGradient>
          <RadialGradient id={id('iris')} cx="0.4" cy="0.35" r="0.7">
            <Stop offset="0" stopColor="#2ee8ae" />
            <Stop offset="0.6" stopColor="#0a4a35" />
            <Stop offset="1" stopColor="#04140e" />
          </RadialGradient>
          <LinearGradient id={id('lid')} x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0" stopColor="#3df0b4" />
            <Stop offset="1" stopColor="#19e3a1" />
          </LinearGradient>
          <RadialGradient id={id('badge')} cx="0.35" cy="0.3" r="0.8">
            <Stop offset="0" stopColor="#e6ff7a" />
            <Stop offset="0.55" stopColor="#d4ff3a" />
            <Stop offset="1" stopColor="#9bc21a" />
          </RadialGradient>
          <RadialGradient id={id('shadow')} cx="0.5" cy="0.5" r="0.5">
            <Stop offset="0" stopColor="#000" stopOpacity="0.5" />
            <Stop offset="0.6" stopColor="#000" stopOpacity="0.2" />
            <Stop offset="1" stopColor="#000" stopOpacity="0" />
          </RadialGradient>
          <ClipPath id={id('clip')}>
            <Path d={BODY_PATH} />
          </ClipPath>
          <ClipPath id={id('eye-l')}>
            <Ellipse cx={47} cy={63} rx={8.4} ry={9.8} />
          </ClipPath>
          <ClipPath id={id('eye-r')}>
            <Ellipse cx={73} cy={63} rx={8.4} ry={9.8} />
          </ClipPath>
        </Defs>

        <Ellipse cx={60} cy={135} rx={34} ry={5.5} fill={url('shadow')} />

        {current === 'rest' ? (
          <G x={98} y={130} rotation={-8}>
            <Rect x={-9} y={-1.3} width={18} height={2.6} rx={1.3} fill="#2f5a49" />
            <Rect x={-11} y={-5.5} width={4.6} height={11} rx={1.6} fill="#0f2a21" />
            <Rect x={6.4} y={-5.5} width={4.6} height={11} rx={1.6} fill="#0f2a21" />
          </G>
        ) : null}

        <G y={pose.y}>
          {([['l', 48.5, -1], ['r', 71.5, 1]] as const).map(([side, x, dir]) => (
            <G key={side} x={x} y={104}>
              <Capsule len={10} w={10.5} fill={url('leg')} />
              <G y={10}>
                <Capsule len={9} w={9.5} fill={url('leg')} />
                <G y={13} scaleX={dir}>
                  <Path d="M5 -5.2C5 -7 3.8 -8 2 -8H-3.4C-8.6 -8 -12.5 -4.6 -12.5 -0.4V0.8H5Z" fill={url('shoe')} />
                  <Rect x={-13} y={0.2} width={18.6} height={3.4} rx={1.7} fill="#f4f6fb" />
                  <Path d="M-6.5 -6.4L-2.4 -3.2M-3.2 -7.6L0.6 -4.4" stroke="#fff" strokeWidth={1.1} strokeLinecap="round" opacity={0.8} />
                </G>
              </G>
            </G>
          ))}

          <G>
            <Path d={BODY_PATH} fill="#b8f5d8" />
            <G clipPath={url('clip')}>
              <Path d={BODY_PATH} fill={url('body')} x={-1.6} y={-0.8} />
              <Path d="M96 40C104 62 102 92 84 110" fill="none" stroke={url('rim')} strokeWidth={4} opacity={0.7} />
              <Ellipse cx={60} cy={118} rx={44} ry={20} fill={url('ao')} />
              <Ellipse cx={60} cy={96} rx={20} ry={13} fill="#fff" opacity={0.08} />
              <Path d="M14 37Q60 23 106 37V47Q60 33 14 47Z" fill={url('band')} />
              <Path d="M14 38.6Q60 24.6 106 38.6" fill="none" stroke="#f3ffc4" strokeWidth={1.1} opacity={0.6} />
              <Path d="M14 47Q60 33 106 47" fill="none" stroke="#4f6b0a" strokeWidth={1.4} opacity={0.35} />
            </G>

            <Ellipse cx={42} cy={31} rx={12} ry={6.5} fill={url('spec')} rotation={-28} originX={42} originY={31} />
            <Circle cx={37.5} cy={29.5} r={2.1} fill="#fff" opacity={0.9} />

            <G y={-4}>
              <Path d="M96.5 44.5C104 42 110 37 113 31C112 38 108 45 100 48.5Z" fill={url('band')} />
              <Path d="M97 47C104 48.5 110 52 113.5 57.5C107.5 55.5 102 53.5 97 51.5Z" fill="#c8ee2a" />
              <Ellipse cx={97} cy={46.5} rx={3.6} ry={4.4} fill={url('band')} />
            </G>

            <G>
              <Ellipse cx={34.5} cy={77} rx={6.5} ry={3.8} fill="#ff6a8a" opacity={0.4} />
              <Ellipse cx={85.5} cy={77} rx={6.5} ry={3.8} fill="#ff6a8a" opacity={0.4} />

              {happyEyes ? (
                <G fill="none" stroke={INK} strokeWidth={3.4} strokeLinecap="round">
                  <Path d="M39.5 65Q47 55.5 54.5 65" />
                  <Path d="M65.5 65Q73 55.5 80.5 65" />
                </G>
              ) : (
                <G>
                  {eye(47)}
                  {eye(73)}
                </G>
              )}

              <G fill="none" stroke={INK} strokeWidth={2.6} strokeLinecap="round" y={pose.brow[1]}>
                <Path d="M40 49.5Q46.5 46.6 53 48.6" rotation={-pose.brow[2]} originX={53} originY={48.6} />
                <Path d="M80 49.5Q73.5 46.6 67 48.6" rotation={pose.brow[2]} originX={67} originY={48.6} />
              </G>

              {current === 'idle' ? <Path d="M52.5 81Q60 88 67.5 81" fill="none" stroke={INK} strokeWidth={2.8} strokeLinecap="round" /> : null}
              {openMouth ? (
                <G>
                  <Path d="M49.5 79.5H70.5Q70.5 93 60 93Q49.5 93 49.5 79.5Z" fill="#2a0718" />
                  <Path d="M52 79.5H68V81.6Q60 83 52 81.6Z" fill="#fff" />
                  <Ellipse cx={60} cy={89.6} rx={6.2} ry={3.4} fill="#ff5a73" />
                </G>
              ) : null}
              {current === 'count' ? (
                <G>
                  <Ellipse cx={60} cy={84} rx={4.2} ry={4.6} fill="#2a0718" />
                  <Ellipse cx={60} cy={85.8} rx={2.4} ry={1.4} fill="#ff5a73" />
                </G>
              ) : null}
              {current === 'rest' ? <Path d="M55 83Q60 86.4 65 83" fill="none" stroke={INK} strokeWidth={2.4} strokeLinecap="round" /> : null}
              {current === 'worried' ? (
                <Path d="M50.5 86Q53 82.5 55.5 85.4T60.5 85.4T65.5 85.4T70 84.6" fill="none" stroke={INK} strokeWidth={2.6} strokeLinecap="round" strokeLinejoin="round" />
              ) : null}
            </G>

            <G x={60} y={101} opacity={0.92}>
              <Path d="M-4.6 4.8A7 7 0 1 1 4.6 4.8" fill="none" stroke="#f6f8ff" strokeWidth={1.5} strokeLinecap="round" opacity={0.7} />
              <Path d="M-2 3.6V-3.4H2.4M-2 0.2H0.6" fill="none" stroke="#f6f8ff" strokeWidth={1.7} strokeLinecap="round" strokeLinejoin="round" />
              <Circle cx={1.6} cy={0.2} r={1.25} fill="#d4ff3a" />
            </G>
          </G>

          {([['l', 24.5, pose.lA, pose.lB], ['r', 95.5, pose.rA, pose.rB]] as const).map(([side, x, a, b]) => (
            <G key={side} x={x} y={77}>
              <G rotation={a}>
                <Capsule len={13} w={9} fill={url('limb')} />
                <G y={13}>
                  <G rotation={b}>
                    <Capsule len={12} w={8.4} fill={url('limb')} />
                    {side === 'r' && holdsBell ? (
                      <G y={16}>
                        <Rect x={-11} y={-1.3} width={22} height={2.6} rx={1.3} fill="#2f5a49" />
                        <Rect x={-13.5} y={-6} width={5} height={12} rx={1.8} fill="#0f2a21" />
                        <Rect x={8.5} y={-6} width={5} height={12} rx={1.8} fill="#0f2a21" />
                        <Rect x={-12.6} y={-5} width={1.4} height={10} rx={0.7} fill="#fff" opacity={0.28} />
                        <Rect x={9.4} y={-5} width={1.4} height={10} rx={0.7} fill="#fff" opacity={0.28} />
                      </G>
                    ) : null}
                    <Circle cx={0} cy={15} r={6.2} fill={url('glove')} />
                    <Path d="M-3.4 12.4Q-6.4 14 -5.4 17" fill="none" stroke="#9ccdb8" strokeWidth={1} strokeLinecap="round" opacity={0.7} />
                  </G>
                </G>
              </G>
            </G>
          ))}
        </G>

        {current === 'worried' ? <Path d="M104 52Q98 60 98 64A6 6 0 0 0 110 64Q110 60 104 52Z" fill="#b8f5e0" stroke="#fff" strokeOpacity={0.6} /> : null}
        {current === 'rest' ? (
          <G fill="#8ff5cf">
            <SvgText x={94} y={34} fontSize={13} fontWeight="800" fontFamily={fonts.display}>z</SvgText>
            <SvgText x={102} y={22} fontSize={10} fontWeight="800" fontFamily={fonts.display}>z</SvgText>
            <SvgText x={108} y={12} fontSize={8} fontWeight="800" fontFamily={fonts.display}>z</SvgText>
          </G>
        ) : null}
        {current === 'celebrate' || current === 'cheer' ? (
          <G fill="#ffc400">
            {SPARKS.map(([x, y]) => (
              <Path key={`${x}-${y}`} d={`M${x} ${y - 6}l1.8 4.2 4.2 1.8-4.2 1.8-1.8 4.2-1.8-4.2-4.2-1.8 4.2-1.8z`} />
            ))}
          </G>
        ) : null}
        {current === 'count' && count !== undefined ? (
          <G>
            <Circle cx={101} cy={25} r={16} fill={url('badge')} />
            <Circle cx={101} cy={25} r={16} fill="none" stroke="#fff" strokeOpacity={0.5} strokeWidth={1.2} />
            <SvgText x={101} y={31} textAnchor="middle" fontSize={count > 99 ? 13 : 17} fontWeight="800" fontFamily={fonts.display} fill={INK}>
              {String(count)}
            </SvgText>
          </G>
        ) : null}
      </Svg>
    </Animated.View>
  )

  const body = interactive ? (
    <Pressable onPress={poke} feedback={false} accessibilityLabel={`${label}. Tócame para que te anime`} pressScale={0.94}>
      {figure}
    </Pressable>
  ) : (
    figure
  )

  const bubble = text ? (
    <Animated.View
      key={text}
      entering={reduced ? undefined : FadeIn.duration(260)}
      style={[styles.bubble, placement === 'top' && styles.bubbleTop]}
      accessibilityLiveRegion="polite"
    >
      <View style={[styles.tail, placement === 'right' && styles.tailLeft, placement === 'left' && styles.tailRight, placement === 'top' && styles.tailBottom]} />
      <Text variant="small" color={colors.text}>{text}</Text>
    </Animated.View>
  ) : null

  const direction = placement === 'top' ? 'column-reverse' : placement === 'left' ? 'row-reverse' : 'row'
  return (
    <View style={[styles.root, { flexDirection: direction }, style]}>
      {body}
      {bubble}
    </View>
  )
}

const styles = StyleSheet.create({
  root: { alignItems: 'center', gap: 10 },
  bubble: { flexShrink: 1, backgroundColor: colors.surfaceHigh, borderRadius: radii.lg, borderWidth: 1, borderColor: colors.lineStrong, paddingHorizontal: 14, paddingVertical: 10 },
  bubbleTop: { alignSelf: 'stretch' },
  tail: { position: 'absolute', width: 10, height: 10, backgroundColor: colors.surfaceHigh, borderColor: colors.lineStrong, transform: [{ rotate: '45deg' }] },
  tailLeft: { left: -6, top: '50%', marginTop: -5, borderLeftWidth: 1, borderBottomWidth: 1 },
  tailRight: { right: -6, top: '50%', marginTop: -5, borderRightWidth: 1, borderTopWidth: 1 },
  tailBottom: { bottom: -6, left: '50%', marginLeft: -5, borderRightWidth: 1, borderBottomWidth: 1 },
})
