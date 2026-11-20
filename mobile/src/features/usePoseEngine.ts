import * as Speech from 'expo-speech'
import { useCallback, useRef, useState } from 'react'
import { useTensorflowModel } from 'react-native-fast-tflite'
import { useFrameOutput } from 'react-native-vision-camera'
import { useResizer } from 'react-native-vision-camera-resizer'
import { scheduleOnRN } from 'react-native-worklets'
import { MOVENET_URL } from '../lib/config'
import { advanceRepPhase, analyzePose, type Exercise, type PoseAnalysis, type PosePoint, type RepPhase } from '../lib/pose-analysis'
import { FramingGate, type FramingKind, VoiceCoach } from '../lib/pose-validation'

const modelSource = { url: MOVENET_URL }

/**
 * Convierte la salida de MoveNet (coordenadas del cuadrado 192x192 con barras negras por `contain`)
 * a coordenadas normalizadas 0..1 del fotograma real, para que los márgenes y proporciones sean fiables.
 */
function poseFromOutput(buffer: ArrayBuffer, frameWidth: number, frameHeight: number): PosePoint[] {
  'worklet'
  const values = new Float32Array(buffer)
  const longest = Math.max(frameWidth, frameHeight, 1)
  const contentX = frameWidth / longest
  const contentY = frameHeight / longest
  const offsetX = (1 - contentX) / 2
  const offsetY = (1 - contentY) / 2
  const points: PosePoint[] = []
  for (let index = 0; index < 17; index++) {
    const rawY = values[index * 3] ?? 0
    const rawX = values[index * 3 + 1] ?? 0
    const y = rawY > 1 ? rawY / 192 : rawY
    const x = rawX > 1 ? rawX / 192 : rawX
    points.push({
      x: Math.min(1, Math.max(0, (x - offsetX) / contentX)),
      y: Math.min(1, Math.max(0, (y - offsetY) / contentY)),
      confidence: values[index * 3 + 2] ?? 0,
    })
  }
  return points
}

type Options = {
  exercise: Exercise
  /** La cámara y el análisis solo corren mientras es verdadero. */
  running: boolean
  voice: boolean
  /** Cada pose recibida (para enviarla al servicio de IA). */
  onPoints?: (points: PosePoint[]) => void
}

export type PoseSnapshot = {
  reps: number
  holdSeconds: number
  analysis: PoseAnalysis | null
  phase: RepPhase
  visibleJoints: number
  /** Estado del encuadre/postura inicial. Con `kind !== 'ok'` no se cuenta ni se corrige. */
  framing: { kind: FramingKind; message: string }
}

const INITIAL_SNAPSHOT: PoseSnapshot = { reps: 0, holdSeconds: 0, analysis: null, phase: 'ready', visibleJoints: 0, framing: { kind: 'not_visible', message: 'Buscando tu cuerpo en el encuadre…' } }

/** Frases de voz: cada tipo tiene su propio enfriamiento; las repeticiones nunca se silencian. */
const VOICE_COOLDOWN_MS: Record<string, number> = { rep: 0, too_deep: 5000, alignment: 6000, hips: 6000, back_rounded: 5000 }
const FEEDBACK_MIN_INTERVAL_MS = 120

export type ModelStatus = 'loading' | 'ready' | 'error'

/**
 * Motor de postura en el dispositivo: MoveNet (TFLite) sobre los fotogramas de la cámara,
 * conteo de repeticiones con `advanceRepPhase` y feedback con `analyzePose`.
 * Nada del video sale del teléfono; solo se envían coordenadas de articulaciones al backend.
 */
export function usePoseEngine({ exercise, running, voice, onPoints }: Options) {
  const modelState = useTensorflowModel(modelSource, [])
  const model = modelState.state === 'loaded' ? modelState.model : undefined
  const { resizer, error: resizerError } = useResizer({ width: 192, height: 192, channelOrder: 'rgb', dataType: 'float32', pixelLayout: 'interleaved', scaleMode: 'contain' })

  const [snapshot, setSnapshot] = useState<PoseSnapshot>(INITIAL_SNAPSHOT)
  const refs = useRef({
    exercise,
    running,
    voice,
    onPoints,
    lastAngle: null as number | null,
    phase: 'ready' as RepPhase,
    reps: 0,
    plankStart: null as number | null,
    holdSeconds: 0,
    lastFeedbackAt: 0,
    gate: new FramingGate(),
    voiceCoach: new VoiceCoach(
      (text) => void Speech.speak(text, { language: 'es-ES', rate: 1.05 }),
      () => void Speech.stop(),
      VOICE_COOLDOWN_MS,
      8000,
    ),
    last: INITIAL_SNAPSHOT,
    scoreSum: 0,
    scoreCount: 0,
  })
  refs.current.exercise = exercise
  refs.current.running = running
  refs.current.voice = voice
  refs.current.onPoints = onPoints

  const publish = useCallback((s: typeof refs.current, next: PoseSnapshot, now: number) => {
    const previous = s.last
    const changed =
      previous.reps !== next.reps ||
      previous.holdSeconds !== next.holdSeconds ||
      previous.phase !== next.phase ||
      previous.framing.kind !== next.framing.kind ||
      previous.analysis?.feedback !== next.analysis?.feedback ||
      (previous.analysis === null) !== (next.analysis === null) ||
      Math.abs((previous.analysis?.score ?? 0) - (next.analysis?.score ?? 0)) >= 4
    // Los cambios de mensaje/repetición pasan al instante; el resto, como mucho cada 120 ms.
    const urgent = previous.framing.kind !== next.framing.kind || previous.reps !== next.reps
    if (!changed || (!urgent && now - s.lastFeedbackAt < FEEDBACK_MIN_INTERVAL_MS)) return
    s.lastFeedbackAt = now
    s.last = next
    setSnapshot(next)
  }, [])

  /**
   * Todo el feedback es local: nunca espera a la red. El estado de React solo cambia cuando cambia
   * lo que se ve en pantalla (mensaje, repeticiones, fase, puntuación), no en cada fotograma.
   */
  const receivePose = useCallback((points: PosePoint[]) => {
    const s = refs.current
    if (!s.running) return
    const now = Date.now()
    const selected = s.exercise
    const visibleJoints = points.filter((point) => point.confidence >= 0.3).length
    const framing = s.gate.push(points, selected)

    let analysis: PoseAnalysis | null = null
    if (framing.kind === 'ok') {
      s.onPoints?.(points)
      analysis = analyzePose(points, selected)
    }

    if (!analysis) {
      if (selected === 'plank') s.plankStart = null
      if (framing.kind !== 'ok' && framing.confirmed && s.voice) s.voiceCoach.say(framing.kind, framing.message, now)
      publish(s, { ...s.last, analysis: null, visibleJoints, framing: { kind: framing.kind, message: framing.message } }, now)
      return
    }

    s.scoreSum += analysis.score
    s.scoreCount += 1

    if (selected === 'plank') {
      if (analysis.score >= 55) {
        s.plankStart ??= now - s.holdSeconds * 1000
        s.holdSeconds = Math.floor((now - s.plankStart) / 1000)
      } else {
        s.plankStart = null
      }
    } else if (analysis.movementAngle !== null) {
      const filtered = s.lastAngle === null ? analysis.movementAngle : s.lastAngle * 0.7 + analysis.movementAngle * 0.3
      s.lastAngle = filtered
      const next = advanceRepPhase(selected, s.phase, filtered)
      s.phase = next.phase
      if (next.completed) {
        s.reps += 1
        if (s.voice) s.voiceCoach.say('rep', String(s.reps), now)
      }
    }

    // Una corrección a la vez; si no hay, se queda la indicación de fase.
    if (s.voice && analysis.correction && s.phase !== 'ready') s.voiceCoach.say(analysis.correction, analysis.feedback, now)

    publish(s, { reps: s.reps, holdSeconds: s.holdSeconds, analysis, phase: s.phase, visibleJoints, framing: { kind: 'ok', message: '' } }, now)
  }, [publish])

  const frameOutput = useFrameOutput({
    pixelFormat: 'yuv',
    // Sin esto el fotograma llega girado 90° (orientación del sensor) y MoveNet ve a la persona tumbada.
    enablePhysicalBufferRotation: true,
    onFrame(frame) {
      'worklet'
      try {
        if (!model || !resizer) return
        const frameWidth = frame.width
        const frameHeight = frame.height
        const resized = resizer.resize(frame)
        const pixels = new Float32Array(resized.getPixelBuffer())
        resized.dispose()
        const inputPixels = new Float32Array(pixels.length)
        for (let index = 0; index < pixels.length; index++) inputPixels[index] = pixels[index] * 255
        const outputs = model.runSync([inputPixels.buffer])
        if (outputs[0]) scheduleOnRN(receivePose, poseFromOutput(outputs[0], frameWidth, frameHeight))
      } catch {
        // Un fotograma fallido no debe detener la sesión.
      } finally {
        frame.dispose()
      }
    },
  })

  /** Reinicia contadores (nueva sesión o cambio de ejercicio). */
  const reset = useCallback(() => {
    const s = refs.current
    s.lastAngle = null
    s.phase = 'ready'
    s.reps = 0
    s.plankStart = null
    s.holdSeconds = 0
    s.scoreSum = 0
    s.scoreCount = 0
    s.gate.reset()
    s.voiceCoach.reset()
    s.last = INITIAL_SNAPSHOT
    setSnapshot(INITIAL_SNAPSHOT)
  }, [])

  /** La plancha deja de contar al pausar. */
  const pauseHold = useCallback(() => {
    refs.current.plankStart = null
  }, [])

  /** Precisión media de la sesión (0 si no hubo pose). */
  const averageScore = useCallback(() => {
    const s = refs.current
    return s.scoreCount ? Math.round(s.scoreSum / s.scoreCount) : 0
  }, [])

  const status: ModelStatus = resizerError || modelState.state === 'error' ? 'error' : modelState.state === 'loaded' && resizer ? 'ready' : 'loading'

  return { frameOutput, snapshot, status, reset, pauseHold, averageScore }
}
