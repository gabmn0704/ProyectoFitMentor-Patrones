import * as Speech from 'expo-speech'
import { useCallback, useRef, useState } from 'react'
import { useTensorflowModel } from 'react-native-fast-tflite'
import { useFrameOutput } from 'react-native-vision-camera'
import { useResizer } from 'react-native-vision-camera-resizer'
import { scheduleOnRN } from 'react-native-worklets'
import { MOVENET_URL } from '../lib/config'
import { advanceRepPhase, analyzePose, type Exercise, type PoseAnalysis, type PosePoint, type RepPhase } from '../lib/pose-analysis'

const modelSource = { url: MOVENET_URL }

function poseFromOutput(buffer: ArrayBuffer): PosePoint[] {
  'worklet'
  const values = new Float32Array(buffer)
  const points: PosePoint[] = []
  for (let index = 0; index < 17; index++) {
    const y = values[index * 3] ?? 0
    const x = values[index * 3 + 1] ?? 0
    points.push({ x: x > 1 ? x / 192 : x, y: y > 1 ? y / 192 : y, confidence: values[index * 3 + 2] ?? 0 })
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
}

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

  const [snapshot, setSnapshot] = useState<PoseSnapshot>({ reps: 0, holdSeconds: 0, analysis: null, phase: 'ready', visibleJoints: 0 })
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
    lastSpokenAt: 0,
    scoreSum: 0,
    scoreCount: 0,
  })
  refs.current.exercise = exercise
  refs.current.running = running
  refs.current.voice = voice
  refs.current.onPoints = onPoints

  const receivePose = useCallback((points: PosePoint[]) => {
    const s = refs.current
    if (!s.running) return
    const now = Date.now()
    const selected = s.exercise
    s.onPoints?.(points)
    const visibleJoints = points.filter((point) => point.confidence >= 0.3).length
    const result = analyzePose(points, selected)

    if (!result) {
      if (selected === 'plank') s.plankStart = null
      if (now - s.lastFeedbackAt >= 300) {
        s.lastFeedbackAt = now
        setSnapshot((previous) => ({ ...previous, analysis: null, visibleJoints }))
      }
      return
    }

    s.scoreSum += result.score
    s.scoreCount += 1

    if (selected === 'plank') {
      if (result.score >= 55) {
        s.plankStart ??= now - s.holdSeconds * 1000
        s.holdSeconds = Math.floor((now - s.plankStart) / 1000)
      } else {
        s.plankStart = null
      }
    } else if (result.movementAngle !== null) {
      const filtered = s.lastAngle === null ? result.movementAngle : s.lastAngle * 0.7 + result.movementAngle * 0.3
      s.lastAngle = filtered
      const next = advanceRepPhase(selected, s.phase, filtered)
      s.phase = next.phase
      if (next.completed) {
        s.reps += 1
        if (s.voice && now - s.lastSpokenAt > 1500) {
          s.lastSpokenAt = now
          void Speech.speak(String(s.reps), { language: 'es-ES', rate: 1.05 })
        }
      }
    }

    if (now - s.lastFeedbackAt >= 180) {
      s.lastFeedbackAt = now
      setSnapshot({ reps: s.reps, holdSeconds: s.holdSeconds, analysis: result, phase: s.phase, visibleJoints })
      if (s.voice && now - s.lastSpokenAt > 4500 && result.score < 72) {
        s.lastSpokenAt = now
        void Speech.speak(result.feedback, { language: 'es-ES', rate: 1 })
      }
    }
  }, [])

  const frameOutput = useFrameOutput({
    pixelFormat: 'yuv',
    onFrame(frame) {
      'worklet'
      try {
        if (!model || !resizer) return
        const resized = resizer.resize(frame)
        const pixels = new Float32Array(resized.getPixelBuffer())
        resized.dispose()
        const inputPixels = new Float32Array(pixels.length)
        for (let index = 0; index < pixels.length; index++) inputPixels[index] = pixels[index] * 255
        const outputs = model.runSync([inputPixels.buffer])
        if (outputs[0]) scheduleOnRN(receivePose, poseFromOutput(outputs[0]))
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
    void Speech.stop()
    setSnapshot({ reps: 0, holdSeconds: 0, analysis: null, phase: 'ready', visibleJoints: 0 })
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
