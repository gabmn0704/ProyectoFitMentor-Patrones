import { useEffect, useState } from 'react'
import { StyleSheet, View } from 'react-native'
import Animated, { useAnimatedStyle, useReducedMotion, useSharedValue, withDelay, withTiming } from 'react-native-reanimated'
import Svg, { Circle, Line, Path, Text as SvgText } from 'react-native-svg'
import { colors, fonts, radii } from '../theme'
import { Text } from './Text'

/** Número que sube hasta su valor (odómetro simplificado). Estático con movimiento reducido. */
export function CountUp({ value, duration = 900, style }: { value: number; duration?: number; style?: object }) {
  const reduced = useReducedMotion()
  const [shown, setShown] = useState(reduced ? value : 0)
  useEffect(() => {
    if (reduced) {
      setShown(value)
      return
    }
    const started = Date.now()
    let frame = 0
    const tick = () => {
      const progress = Math.min(1, (Date.now() - started) / duration)
      setShown(Math.round(value * (1 - Math.pow(1 - progress, 3))))
      if (progress < 1) frame = requestAnimationFrame(tick)
    }
    frame = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(frame)
  }, [value, duration, reduced])
  return <Text variant="numeral" style={style}>{shown}</Text>
}

type LaneDatum = { label: string; value: number; best?: boolean }

/** Carriles de foto-final: un carril por día, barra cobalto (bermellón el mejor), meta punteada. */
export function Lanes({ data, unit = 'rep' }: { data: LaneDatum[]; unit?: string }) {
  const max = Math.max(1, ...data.map((d) => d.value))
  return (
    <View style={styles.lanes} accessible accessibilityLabel={`Actividad de la semana: ${data.map((d) => `${d.label} ${d.value} ${unit}`).join(', ')}`}>
      {data.map((datum, index) => (
        <Lane key={datum.label + index} datum={datum} ratio={datum.value / max} index={index} />
      ))}
    </View>
  )
}

function Lane({ datum, ratio, index }: { datum: LaneDatum; ratio: number; index: number }) {
  const reduced = useReducedMotion()
  const progress = useSharedValue(reduced ? 1 : 0)
  useEffect(() => {
    if (!reduced) progress.value = withDelay(index * 80, withTiming(1, { duration: 700 }))
  }, [index, progress, reduced])
  const bar = useAnimatedStyle(() => ({ width: `${Math.max(datum.value ? 4 : 0, ratio * 100) * progress.value}%` }))
  return (
    <View style={styles.lane}>
      <Text variant="label" color={colors.textMuted} style={styles.laneDay}>{datum.label}</Text>
      <View style={styles.track}>
        <Animated.View style={[styles.bar, { backgroundColor: datum.best ? colors.vermilion : colors.cobalt }, bar]} />
      </View>
      <Text variant="bodyStrong" color={datum.best ? colors.signalText : colors.text} style={styles.laneValue}>
        {datum.value}
      </Text>
    </View>
  )
}

/** Gráfica de línea de la precisión: cobalto, con puntos y eje de días. */
export function LineChart({ values, labels, height = 140, max = 100 }: { values: number[]; labels: string[]; height?: number; max?: number }) {
  const [width, setWidth] = useState(0)
  const padX = 12
  const padTop = 12
  const padBottom = 24
  const innerH = height - padTop - padBottom
  const step = values.length > 1 ? (width - padX * 2) / (values.length - 1) : 0
  const points = values.map((value, index) => ({
    x: padX + index * step,
    y: padTop + innerH - (Math.min(max, value) / max) * innerH,
    value,
  }))
  const path = points.map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x.toFixed(1)} ${p.y.toFixed(1)}`).join(' ')
  return (
    <View onLayout={(event) => setWidth(event.nativeEvent.layout.width)} accessible accessibilityLabel={`Precisión por día: ${values.map((v, i) => `${labels[i]} ${v} por ciento`).join(', ')}`}>
      {width > 0 ? (
        <Svg width={width} height={height}>
          {[0, 50, 100].map((tick) => {
            const y = padTop + innerH - (tick / 100) * innerH
            return <Line key={tick} x1={padX} x2={width - padX} y1={y} y2={y} stroke={colors.line} strokeWidth={1} strokeDasharray={tick === 100 ? '4 4' : undefined} />
          })}
          {path ? <Path d={path} stroke={colors.cobaltText} strokeWidth={3} fill="none" strokeLinecap="round" strokeLinejoin="round" /> : null}
          {points.map((p, i) => (
            <Circle key={i} cx={p.x} cy={p.y} r={p.value > 0 ? 4.5 : 2.5} fill={p.value > 0 ? colors.cobalt : colors.lineStrong} stroke={colors.bg} strokeWidth={2} />
          ))}
          {points.map((p, i) => (
            <SvgText key={`l${i}`} x={p.x} y={height - 6} fill={colors.textSubtle} fontSize={11} fontFamily={fonts.bodySemi} textAnchor="middle">
              {labels[i]}
            </SvgText>
          ))}
        </Svg>
      ) : (
        <View style={{ height }} />
      )}
    </View>
  )
}

/** Anillo de progreso (meta semanal). */
export function Ring({ percent, size = 120, stroke = 12, children }: { percent: number; size?: number; stroke?: number; children?: React.ReactNode }) {
  const reduced = useReducedMotion()
  const radius = (size - stroke) / 2
  const circumference = 2 * Math.PI * radius
  const [shown, setShown] = useState(reduced ? percent : 0)
  useEffect(() => {
    if (reduced) return setShown(percent)
    const started = Date.now()
    let frame = 0
    const tick = () => {
      const progress = Math.min(1, (Date.now() - started) / 900)
      setShown(percent * (1 - Math.pow(1 - progress, 3)))
      if (progress < 1) frame = requestAnimationFrame(tick)
    }
    frame = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(frame)
  }, [percent, reduced])
  return (
    <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }} accessible accessibilityLabel={`${percent} por ciento de la meta semanal`}>
      <Svg width={size} height={size} style={StyleSheet.absoluteFill}>
        <Circle cx={size / 2} cy={size / 2} r={radius} stroke={colors.surfaceHigh} strokeWidth={stroke} fill="none" />
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={colors.vermilion}
          strokeWidth={stroke}
          fill="none"
          strokeLinecap="round"
          strokeDasharray={`${circumference} ${circumference}`}
          strokeDashoffset={circumference * (1 - shown / 100)}
          rotation={-90}
          origin={`${size / 2}, ${size / 2}`}
        />
      </Svg>
      {children}
    </View>
  )
}

/** Barra horizontal de progreso fina. */
export function Meter({ percent, color = colors.cobalt }: { percent: number; color?: string }) {
  return (
    <View style={styles.meter} accessibilityRole="progressbar" accessibilityValue={{ min: 0, max: 100, now: percent }}>
      <View style={[styles.meterFill, { width: `${Math.max(0, Math.min(100, percent))}%`, backgroundColor: color }]} />
    </View>
  )
}

const styles = StyleSheet.create({
  lanes: { gap: 10 },
  lane: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  laneDay: { width: 32 },
  track: { flex: 1, height: 14, backgroundColor: colors.surfaceHigh, borderRadius: radii.xs, overflow: 'hidden' },
  bar: { height: '100%', borderRadius: radii.xs },
  laneValue: { width: 38, textAlign: 'right', fontFamily: fonts.displayBold },
  meter: { height: 6, backgroundColor: colors.surfaceHigh, borderRadius: 3, overflow: 'hidden' },
  meterFill: { height: '100%', borderRadius: 3 },
})
