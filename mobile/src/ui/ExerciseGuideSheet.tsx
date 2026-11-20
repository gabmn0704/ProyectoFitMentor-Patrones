import { Camera, Check, Timer, Wind, X } from 'lucide-react-native'
import { useEffect, useState } from 'react'
import { Modal, ScrollView, StyleSheet, View } from 'react-native'
import Svg, { Circle, G, Line, Path, Rect, Text as SvgText } from 'react-native-svg'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { catalogLabel, type CatalogId } from '../lib/catalog'
import { FLOOR_Y, GUIDES, type PoseFrame } from '../lib/exerciseGuide'
import { colors, radii } from '../theme'
import { Button } from './Button'
import { Card } from './Card'
import { haptic } from './haptics'
import { Pressable } from './Pressable'
import { Text } from './Text'

const toPath = (points: ReadonlyArray<readonly [number, number]>) => points.map(([x, y], index) => `${index ? 'L' : 'M'}${x},${y}`).join(' ')

function Figure({ frame, label }: { frame: PoseFrame; label: string }) {
  const tone = frame.wrong ? colors.danger : colors.mint
  return (
    <View style={styles.figure}>
      <View style={[styles.figureBox, { borderColor: frame.wrong ? 'rgba(255,77,106,0.5)' : colors.line }]}>
        <Svg viewBox="0 0 200 160" width="100%" height="100%" accessibilityLabel={label}>
          <Line x1={8} x2={192} y1={FLOOR_Y} y2={FLOOR_Y} stroke={colors.lineStrong} strokeWidth={1.5} />
          {frame.props?.map(([x, y, w, h], index) => (
            <Rect key={index} x={x} y={y} width={w} height={h} rx={3} fill={colors.surfaceHigh} stroke={colors.lineStrong} />
          ))}
          {frame.bar ? (
            <G>
              <Line x1={frame.bar[0] - 30} x2={frame.bar[0] + 30} y1={frame.bar[1]} y2={frame.bar[1]} stroke={colors.textMuted} strokeWidth={3} />
              <Circle cx={frame.bar[0]} cy={frame.bar[1]} r={11} fill="none" stroke={colors.textMuted} strokeWidth={3} />
            </G>
          ) : null}
          {frame.weight ? <Circle cx={frame.weight[0]} cy={frame.weight[1]} r={7} fill={colors.lime} /> : null}
          {frame.limbs.map((limb, index) => (
            <Path key={index} d={toPath(limb)} stroke={tone} strokeWidth={6} strokeLinecap="round" strokeLinejoin="round" fill="none" />
          ))}
          <Circle cx={frame.head[0]} cy={frame.head[1]} r={8} fill={tone} />
          {frame.mark ? (
            <G>
              <Circle cx={frame.mark.at[0]} cy={frame.mark.at[1]} r={6} fill="none" stroke={colors.lime} strokeWidth={2} />
              <SvgText x={frame.mark.at[0] + (frame.mark.dx ?? 10)} y={frame.mark.at[1] - 8} fill={colors.lime} fontSize={12} fontWeight="bold">
                {frame.mark.label}
              </SvgText>
            </G>
          ) : null}
        </Svg>
      </View>
      <View style={styles.caption}>
        {frame.wrong ? <X size={13} color={colors.danger} /> : <Check size={13} color={colors.mint} />}
        <Text variant="small" color={colors.textMuted} style={styles.captionText}>{frame.caption}</Text>
      </View>
    </View>
  )
}

export type GuideSession = { sets: number; target: number; unit: 'reps' | 'seconds'; restSec: number; perSide?: boolean }

type Props = {
  exercise: CatalogId | null
  onClose: () => void
  /** Si se pasa, el ejercicio no tiene cámara: se ofrece un modo guiado para marcar series y descansar. */
  session?: GuideSession
  onTrain?: () => void
}

/** Cómo se hace el ejercicio (dos posiciones dibujadas, pasos, errores, respiración, colocación) y, sin cámara, un modo guiado. */
export function ExerciseGuideSheet({ exercise, onClose, session, onTrain }: Props) {
  const insets = useSafeAreaInsets()
  const [done, setDone] = useState(0)
  const [rest, setRest] = useState(0)

  useEffect(() => {
    setDone(0)
    setRest(0)
  }, [exercise])

  useEffect(() => {
    if (rest <= 0) return
    const timer = setTimeout(() => {
      setRest((value) => {
        if (value - 1 === 0) haptic.success()
        return value - 1
      })
    }, 1000)
    return () => clearTimeout(timer)
  }, [rest])

  if (!exercise) return null
  const guide = GUIDES[exercise]
  const name = catalogLabel(exercise)
  const finished = session ? done >= session.sets : false

  const markSet = () => {
    if (!session) return
    haptic.medium()
    const next = done + 1
    setDone(next)
    if (next < session.sets) setRest(session.restSec)
    else haptic.success()
  }

  return (
    <Modal visible animationType="slide" onRequestClose={onClose} presentationStyle="fullScreen" statusBarTranslucent>
      <View style={[styles.root, { paddingTop: insets.top + 8 }]}>
        <View style={styles.head}>
          <View style={styles.flex}>
            <Text variant="label" color={colors.cobaltText}>Técnica</Text>
            <Text variant="headline" accessibilityRole="header" numberOfLines={2}>{name}</Text>
          </View>
          <Pressable onPress={onClose} accessibilityLabel="Cerrar la guía" style={styles.close}>
            <X size={22} color={colors.text} />
          </Pressable>
        </View>

        <ScrollView contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 32 }]} showsVerticalScrollIndicator={false}>
          <View style={styles.frames}>
            {guide.frames.map((frame) => (
              <Figure key={frame.caption} frame={frame} label={`${name}: ${frame.caption}`} />
            ))}
          </View>

          <Card style={styles.block}>
            <Text variant="label" color={colors.cobaltText}>Cómo se hace</Text>
            {guide.steps.map((step, index) => (
              <View key={step} style={styles.step}>
                <View style={styles.stepNum}>
                  <Text variant="small" color={colors.onCobalt} style={styles.stepNumText}>{index + 1}</Text>
                </View>
                <Text style={styles.flex}>{step}</Text>
              </View>
            ))}
          </Card>

          <Card tone="field" style={styles.block}>
            <Text variant="label" color={colors.dangerText}>Evita</Text>
            {guide.mistakes.map((mistake) => (
              <View key={mistake} style={styles.step}>
                <X size={16} color={colors.danger} style={styles.mistakeIcon} />
                <Text style={styles.flex} color={colors.textMuted}>{mistake}</Text>
              </View>
            ))}
          </Card>

          <Card tone="cobalt" style={styles.block}>
            <View style={styles.tip}>
              <Wind size={18} color={colors.mint} />
              <Text style={styles.flex}>{guide.breath}</Text>
            </View>
            <View style={styles.tip}>
              <Camera size={18} color={colors.mint} />
              <Text style={styles.flex}>{guide.camera}</Text>
            </View>
          </Card>

          {session ? (
            <Card tone="signal" style={styles.block}>
              <Text variant="label" color={colors.signalText}>Modo guiado · sin cámara</Text>
              <Text variant="title">
                {session.sets} series × {session.target} {session.unit === 'seconds' ? 's' : 'reps'}
                {session.perSide ? ' por lado' : ''}
              </Text>
              <View style={styles.dots}>
                {Array.from({ length: session.sets }, (_, index) => (
                  <View key={index} style={[styles.setDot, index < done && styles.setDotOn]}>
                    {index < done ? <Check size={16} color={colors.onCobalt} strokeWidth={3} /> : <Text variant="small" color={colors.textMuted}>{index + 1}</Text>}
                  </View>
                ))}
              </View>
              {rest > 0 ? (
                <View style={styles.rest} accessibilityLiveRegion="polite">
                  <Timer size={18} color={colors.lime} />
                  <Text variant="bodyStrong" color={colors.lime}>Descansa {rest} s</Text>
                </View>
              ) : null}
              {finished ? (
                <Text variant="bodyStrong" color={colors.mint}>¡Ejercicio completado! Buen trabajo.</Text>
              ) : (
                <Button label={`Serie ${done + 1} hecha`} onPress={markSet} large icon={<Check size={18} color="#0a0c12" />} />
              )}
              {finished ? <Button label="Repetir" variant="ghost" onPress={() => { setDone(0); setRest(0) }} /> : null}
            </Card>
          ) : onTrain ? (
            <Button label="Medir con la cámara" onPress={onTrain} large icon={<Camera size={18} color="#0a0c12" />} />
          ) : null}
        </ScrollView>
      </View>
    </Modal>
  )
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  flex: { flex: 1 },
  head: { flexDirection: 'row', alignItems: 'flex-start', gap: 12, paddingHorizontal: 20, paddingBottom: 8 },
  close: { width: 44, height: 44, borderRadius: 22, borderWidth: 1, borderColor: colors.lineStrong, alignItems: 'center', justifyContent: 'center' },
  content: { paddingHorizontal: 20, gap: 16, paddingTop: 8 },
  frames: { flexDirection: 'row', gap: 12 },
  figure: { flex: 1, gap: 8 },
  figureBox: { aspectRatio: 200 / 160, borderRadius: radii.xl, borderWidth: 1, backgroundColor: colors.field, overflow: 'hidden', padding: 6 },
  caption: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  captionText: { flex: 1 },
  block: { gap: 12 },
  step: { flexDirection: 'row', gap: 12, alignItems: 'flex-start' },
  stepNum: { width: 24, height: 24, borderRadius: 12, backgroundColor: colors.cobalt, alignItems: 'center', justifyContent: 'center', marginTop: 1 },
  stepNumText: { fontWeight: '700' },
  mistakeIcon: { marginTop: 3 },
  tip: { flexDirection: 'row', gap: 12, alignItems: 'flex-start' },
  dots: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  setDot: { width: 40, height: 40, borderRadius: 20, borderWidth: 1.5, borderColor: colors.lineStrong, alignItems: 'center', justifyContent: 'center' },
  setDotOn: { backgroundColor: colors.cobalt, borderColor: colors.cobalt },
  rest: { flexDirection: 'row', alignItems: 'center', gap: 8 },
})
