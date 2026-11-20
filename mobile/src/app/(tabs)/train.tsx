import { router, useFocusEffect, useLocalSearchParams } from 'expo-router'
import * as Speech from 'expo-speech'
import { activateKeepAwakeAsync, deactivateKeepAwake } from 'expo-keep-awake'
import { Camera as CameraIcon, Check, Pause, Play, RotateCcw, Save, ShieldCheck, Square, TriangleAlert, Volume2, VolumeX, Wifi, WifiOff } from 'lucide-react-native'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { ActivityIndicator, Linking, ScrollView, StyleSheet, View } from 'react-native'
import Animated, { FadeIn, FadeOut, useAnimatedStyle, useReducedMotion, useSharedValue, withSequence, withTiming } from 'react-native-reanimated'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { Camera, useCameraDevice, useCameraPermission } from 'react-native-vision-camera'
import { SyncBadge } from '../../components/SyncBadge'
import { useRealtime } from '../../features/useRealtime'
import { usePoseEngine } from '../../features/usePoseEngine'
import { warmUpBackend } from '../../lib/api'
import { EXERCISES, isExerciseId } from '../../lib/exercises'
import { formatDuration } from '../../lib/format'
import { kv } from '../../lib/storage'
import { newSessionId } from '../../lib/realtime'
import type { ExerciseId } from '../../lib/types'
import { useAuth } from '../../state/auth'
import { useData } from '../../state/data'
import { colors, fonts, radii } from '../../theme'
import { Button } from '../../ui/Button'
import { BibTile, Card } from '../../ui/Card'
import { haptic } from '../../ui/haptics'
import { Mascot } from '../../ui/Mascot'
import { PageHero } from '../../ui/PageHero'
import { Pressable } from '../../ui/Pressable'
import { Notice } from '../../ui/States'
import { Text } from '../../ui/Text'

type Phase = 'idle' | 'countdown' | 'running' | 'paused' | 'summary'

const SETUP_TIPS: Record<ExerciseId, string> = {
  squat: 'Apoya el teléfono a la altura de la cadera, de lado o en diagonal, con el cuerpo completo en el encuadre.',
  push_up: 'Coloca el teléfono a ras de suelo, de lado, a dos metros. Se ven hombros, cadera y tobillos.',
  plank: 'Coloca el teléfono a ras de suelo, de lado. Mantén cadera y hombros en línea con los tobillos.',
  deadlift: 'Coloca el teléfono de lado a la altura de la cadera, con el cuerpo completo dentro del encuadre.',
  lunge: 'Apoya el teléfono de lado a la altura de la cadera, a dos metros, con ambas piernas visibles.',
}

const ENGINE_EXERCISES = Object.values(EXERCISES)

export default function Train() {
  const params = useLocalSearchParams<{ exercise?: string }>()
  const insets = useSafeAreaInsets()
  const reduced = useReducedMotion()
  const { token } = useAuth()
  const { saveSession } = useData()
  const [exercise, setExercise] = useState<ExerciseId>('squat')
  const [phase, setPhase] = useState<Phase>('idle')
  const [countdown, setCountdown] = useState(3)
  const [elapsed, setElapsed] = useState(0)
  const [voice, setVoice] = useState(true)
  const [front, setFront] = useState(false)
  const [error, setError] = useState('')
  const [saved, setSaved] = useState(false)
  const [saving, setSaving] = useState(false)
  const summary = useRef({ reps: 0, accuracy: 0, durationSeconds: 0 })
  const sessionId = useRef('')

  const { hasPermission, canRequestPermission, requestPermission } = useCameraPermission()
  const device = useCameraDevice(front ? 'front' : 'back')
  const meta = EXERCISES[exercise]
  const isHold = meta.unit === 'seconds'
  const running = phase === 'running'

  const realtime = useRealtime(token, phase === 'countdown' || phase === 'running' || phase === 'paused')
  const engine = usePoseEngine({
    exercise,
    running,
    voice,
    onPoints: useCallback((points) => realtime.sendPose(exercise, points), [realtime, exercise]),
  })
  const { snapshot, pauseHold } = engine
  const amount = isHold ? snapshot.holdSeconds : snapshot.reps

  // Ejercicio sugerido desde Inicio / Plan.
  useEffect(() => {
    if (params.exercise && isExerciseId(params.exercise) && phase === 'idle') setExercise(params.exercise)
  }, [params.exercise, phase])

  useEffect(() => {
    void kv.getString('fitmentor.voice').then((value) => value === 'off' && setVoice(false))
  }, [])

  const toggleVoice = () => {
    setVoice((value) => {
      void kv.setString('fitmentor.voice', value ? 'off' : 'on')
      if (value) void Speech.stop()
      return !value
    })
  }

  // Cronómetro.
  useEffect(() => {
    if (!running) return
    const timer = setInterval(() => setElapsed((value) => value + 1), 1000)
    return () => clearInterval(timer)
  }, [running])

  // Cuenta atrás 3-2-1.
  useEffect(() => {
    if (phase !== 'countdown') return
    if (countdown === 0) {
      haptic.success()
      setPhase('running')
      return
    }
    haptic.medium()
    const timer = setTimeout(() => setCountdown((value) => value - 1), 900)
    return () => clearTimeout(timer)
  }, [phase, countdown])

  // La pantalla no se apaga mientras se entrena.
  useEffect(() => {
    if (phase === 'countdown' || phase === 'running') {
      void activateKeepAwakeAsync('fitmentor-train')
      return () => void deactivateKeepAwake('fitmentor-train')
    }
  }, [phase])

  // Despierta el backend y la IA al entrar, antes de que empiece la cuenta atrás.
  useFocusEffect(useCallback(() => warmUpBackend(), []))

  // Al salir de la pestaña se pausa, para no gastar batería con la cámara abierta.
  useFocusEffect(
    useCallback(
      () => () => {
        setPhase((current) => (current === 'running' || current === 'countdown' ? 'paused' : current))
        pauseHold()
      },
      [pauseHold],
    ),
  )

  // Pulso del contador cuando suma una repetición.
  const pulse = useSharedValue(1)
  const pulseStyle = useAnimatedStyle(() => ({ transform: [{ scale: pulse.value }] }))
  const lastAmount = useRef(0)
  useEffect(() => {
    if (amount > lastAmount.current && !isHold) {
      haptic.light()
      if (!reduced) pulse.value = withSequence(withTiming(1.14, { duration: 90 }), withTiming(1, { duration: 220 }))
    }
    lastAmount.current = amount
  }, [amount, isHold, pulse, reduced])

  const permissionDenied = !hasPermission && !canRequestPermission
  const modelMessage =
    engine.status === 'ready' ? 'Modelo listo · se analiza en el teléfono' : engine.status === 'error' ? 'No se pudo cargar el modelo de postura. Revisa tu conexión (se descarga la primera vez).' : 'Descargando el modelo de postura…'

  const start = async () => {
    setError('')
    if (!hasPermission) {
      const granted = await requestPermission()
      if (!granted) {
        setError('Sin permiso de cámara no se puede analizar tu postura.')
        return haptic.warn()
      }
    }
    if (!device) {
      setError('No se detectó una cámara disponible en este teléfono.')
      return haptic.warn()
    }
    if (engine.status !== 'ready') {
      setError(modelMessage)
      return haptic.warn()
    }
    engine.reset()
    setElapsed(0)
    setSaved(false)
    setCountdown(3)
    sessionId.current = newSessionId()
    realtime.startSession(sessionId.current)
    setPhase('countdown')
  }

  const pause = () => {
    engine.pauseHold()
    setPhase('paused')
  }

  const finish = () => {
    haptic.success()
    summary.current = { reps: amount, accuracy: engine.averageScore(), durationSeconds: elapsed }
    realtime.endSession()
    void Speech.stop()
    setPhase('summary')
  }

  const discard = () => {
    engine.reset()
    setPhase('idle')
  }

  const save = async () => {
    setSaving(true)
    try {
      await saveSession({
        exercise,
        reps: summary.current.reps,
        accuracy: summary.current.accuracy,
        durationSeconds: summary.current.durationSeconds,
      })
      haptic.success()
      setSaved(true)
    } finally {
      setSaving(false)
    }
  }

  // El feedback local manda siempre (no espera a la red). La IA solo complementa cuando la pose es válida y no hay corrección.
  const liveFeedback = useMemo(() => {
    if (snapshot.framing.kind !== 'ok') return { text: snapshot.framing.message, source: 'Encuadre', blocked: true }
    if (snapshot.analysis?.correction) return { text: snapshot.analysis.feedback, source: 'Local', blocked: false }
    if (realtime.connected && realtime.feedback?.message) return { text: realtime.feedback.message, source: 'IA', blocked: false }
    if (snapshot.analysis) return { text: snapshot.analysis.feedback, source: 'Local', blocked: false }
    return null
  }, [realtime.connected, realtime.feedback, snapshot.analysis, snapshot.framing])

  const score = snapshot.framing.kind !== 'ok' ? 0 : (snapshot.analysis?.score ?? 0)
  const cameraOn = (phase === 'countdown' || phase === 'running' || phase === 'paused') && hasPermission && Boolean(device)
  const live = phase === 'running' || phase === 'paused' || phase === 'countdown'

  if (phase === 'summary') {
    return (
      <ScrollView style={styles.root} contentContainerStyle={[styles.content, { paddingTop: insets.top + 16, paddingBottom: 120 + insets.bottom }]} showsVerticalScrollIndicator={false}>
        <Animated.View entering={reduced ? undefined : FadeIn.duration(300)} style={styles.stack}>
          <PageHero photo="gym"
            state={summary.current.reps === 0 ? 'worried' : 'celebrate'}
            size={116}
            message={summary.current.reps === 0 ? 'No conté repeticiones. Probemos otra vez con el cuerpo completo en cámara.' : summary.current.accuracy >= 80 ? 'Sesión terminada con muy buena técnica.' : 'Sesión terminada. La próxima cuidamos la técnica.'}
          >
            <View>
              <Text variant="label" color={colors.cobaltText}>Sesión terminada</Text>
              <Text variant="headline" accessibilityRole="header">{meta.label}</Text>
            </View>
          </PageHero>
          <View style={styles.row}>
            <BibTile label={isHold ? 'Segundos' : 'Repeticiones'} value={summary.current.reps} band="cobalt" />
            <BibTile label="Técnica" value={summary.current.accuracy} suffix="%" band="ink" />
          </View>
          <View style={styles.row}>
            <BibTile label="Duración" value={formatDuration(summary.current.durationSeconds)} band="ink" />
          </View>
          {summary.current.reps === 0 ? <Notice tone="info">No se contó ninguna repetición. Puedes descartarla y repetir con el cuerpo completo dentro del encuadre.</Notice> : null}
          <SyncBadge />
          {saved ? (
            <View style={styles.stack}>
              <Notice tone="ok">Sesión guardada. Si no hay conexión, se sube sola cuando vuelva.</Notice>
              <Button label="Ver mi progreso" onPress={() => router.navigate('/progress')} large />
              <Button label="Entrenar otra vez" variant="ghost" onPress={discard} />
            </View>
          ) : (
            <View style={styles.stack}>
              <Button label="Guardar sesión" onPress={() => void save()} loading={saving} large icon={<Save size={18} color="#0a0c12" />} />
              <Button label="Descartar" variant="ghost" onPress={discard} />
            </View>
          )}
        </Animated.View>
      </ScrollView>
    )
  }

  return (
    <View style={[styles.root, { paddingTop: insets.top + 12 }]}>
      {phase === 'idle' ? (
        <View style={styles.head}>
          <Text variant="label" color={colors.cobaltText}>Entrenar</Text>
          <Text variant="headline" accessibilityRole="header">Cámara y técnica</Text>
          <Mascot state="idle" size={72} message={`${meta.label}: yo cuento, tú cuida la técnica.`} placement="right" interactive style={styles.headRep} />
        </View>
      ) : null}

      {phase === 'idle' ? (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.rail} style={styles.railWrap}>
          {ENGINE_EXERCISES.map((item) => (
            <Pressable
              key={item.id}
              onPress={() => { haptic.tap(); setExercise(item.id) }}
              accessibilityRole="button"
              accessibilityLabel={`${item.label}, meta ${item.target}`}
              accessibilityState={{ selected: item.id === exercise }}
              style={[styles.pick, item.id === exercise && styles.pickOn]}
            >
              <Text variant="bodyStrong" color={item.id === exercise ? colors.onCobalt : colors.text}>{item.label}</Text>
              <Text variant="small" color={item.id === exercise ? colors.onCobalt : colors.textMuted}>{item.target} {item.unit === 'seconds' ? 's' : 'reps'}</Text>
            </Pressable>
          ))}
        </ScrollView>
      ) : null}

      <View style={[styles.camera, live && styles.cameraLive]}>
        {cameraOn && device ? <Camera style={StyleSheet.absoluteFill} device={device} isActive={phase !== 'paused'} outputs={[engine.frameOutput]} /> : null}

        {!cameraOn ? (
          <View style={styles.placeholder}>
            <View style={styles.camIcon}>
              <CameraIcon size={28} color={colors.text} />
            </View>
            {permissionDenied ? (
              <>
                <Text variant="title" style={styles.center}>La cámara está bloqueada</Text>
                <Text variant="small" color={colors.textMuted} style={styles.center}>Activa el permiso de cámara en los ajustes del teléfono para analizar tu postura.</Text>
                <Button label="Abrir ajustes" variant="ghost" onPress={() => void Linking.openSettings()} />
              </>
            ) : (
              <>
                <Text variant="title" style={styles.center}>{hasPermission ? 'Coloca el teléfono' : 'Usaremos tu cámara'}</Text>
                <Text variant="small" color={colors.textMuted} style={styles.center}>
                  {hasPermission ? SETUP_TIPS[exercise] : 'Para contar tus repeticiones y corregir tu técnica. El video se procesa en el teléfono y nunca se sube.'}
                </Text>
              </>
            )}
          </View>
        ) : null}

        <View style={styles.cameraTop} pointerEvents="none">
          <View style={styles.pill}>
            <View style={[styles.dot, { backgroundColor: running ? colors.vermilion : colors.textSubtle }]} />
            <Text variant="label" style={styles.pillText}>{running ? 'En vivo' : phase === 'paused' ? 'En pausa' : phase === 'countdown' ? 'Prepárate' : 'Listo'}</Text>
          </View>
          <View style={styles.pill}>
            {realtime.connected ? <Wifi size={13} color={colors.good} /> : <WifiOff size={13} color={colors.textMuted} />}
            <Text variant="label" style={styles.pillText}>{live ? (realtime.connected ? 'IA conectada' : 'Análisis local') : 'En el teléfono'}</Text>
          </View>
        </View>

        {phase === 'countdown' ? (
          <Animated.View entering={FadeIn} exiting={FadeOut} style={styles.countdown} pointerEvents="none" accessibilityLiveRegion="polite">
            <Mascot state={countdown === 0 ? 'cheer' : 'wave'} size={96} />
            <Text variant="display" style={styles.countNumber}>{countdown || '¡Ya!'}</Text>
          </Animated.View>
        ) : null}

        {live && phase !== 'countdown' ? (
          <View style={styles.hud} pointerEvents="none">
            <View style={styles.hudRow}>
              <View>
                <Text variant="label" color={colors.textMuted}>{isHold ? 'Segundos' : 'Repeticiones'}</Text>
                <Animated.View style={pulseStyle}>
                  <Text variant="numeral" style={styles.bigNumber} accessibilityLiveRegion="polite">{amount}</Text>
                </Animated.View>
              </View>
              <View style={styles.techBadge}>
                <Text variant="label" color={colors.textMuted}>Técnica</Text>
                <Text variant="title" color={score >= 80 ? colors.good : score >= 60 ? colors.text : colors.dangerText} style={{ fontFamily: fonts.display, fontSize: 30, lineHeight: 34 }}>
                  {score}<Text variant="small" color={colors.textMuted}>%</Text>
                </Text>
              </View>
            </View>
            <View style={styles.feedback}>
              {liveFeedback && !liveFeedback.blocked ? <Check size={16} color={colors.good} /> : snapshot.visibleJoints > 0 ? <TriangleAlert size={16} color={colors.dangerText} /> : <ActivityIndicator size="small" color={colors.cobaltText} />}
              <Text variant="small" style={styles.feedbackText} numberOfLines={2} accessibilityLiveRegion="polite">
                {phase === 'paused' ? 'Sesión en pausa' : liveFeedback ? liveFeedback.text : 'Buscando tu cuerpo en el encuadre…'}
              </Text>
            </View>
          </View>
        ) : null}
      </View>

      {phase === 'idle' ? (
        <View style={[styles.controls, { paddingBottom: 100 + insets.bottom }]}>
          <View style={styles.statusRow}>
            {engine.status === 'loading' ? <ActivityIndicator size="small" color={colors.cobaltText} /> : <ShieldCheck size={16} color={engine.status === 'ready' ? colors.good : colors.dangerText} />}
            <Text variant="small" color={engine.status === 'error' ? colors.dangerText : colors.textMuted} style={styles.flex}>{modelMessage}</Text>
            <Pressable onPress={toggleVoice} accessibilityLabel={voice ? 'Silenciar voz' : 'Activar voz'} accessibilityRole="switch" accessibilityState={{ checked: voice }} style={styles.voice}>
              {voice ? <Volume2 size={20} color={colors.good} /> : <VolumeX size={20} color={colors.textMuted} />}
            </Pressable>
          </View>
          <Card tone="field" style={styles.target}>
            <Text variant="small" color={colors.textMuted}>Meta sugerida</Text>
            <Text variant="title">{meta.target} {isHold ? 'segundos' : 'repeticiones'}</Text>
          </Card>
          {error ? <Notice tone="error">{error}</Notice> : null}
          <Button label={hasPermission ? 'Iniciar sesión' : 'Permitir cámara y empezar'} onPress={() => void start()} large disabled={permissionDenied} icon={<Play size={18} color="#0a0c12" fill="#0a0c12" />} />
          <SyncBadge />
        </View>
      ) : (
        <View style={[styles.controls, { paddingBottom: 100 + insets.bottom }]}>
          <View style={styles.row}>
            <Button
              label={phase === 'paused' ? 'Reanudar' : 'Pausar'}
              variant="ghost"
              onPress={phase === 'paused' ? () => setPhase('running') : pause}
              style={styles.flex}
              icon={phase === 'paused' ? <Play size={18} color={colors.text} fill={colors.text} /> : <Pause size={18} color={colors.text} fill={colors.text} />}
              disabled={phase === 'countdown'}
            />
            <Button label="Terminar" onPress={finish} style={styles.flex} icon={<Square size={16} color="#0a0c12" fill="#0a0c12" />} disabled={phase === 'countdown'} />
          </View>
          <View style={styles.row}>
            <Text variant="small" color={colors.textMuted} style={styles.flex}>{formatDuration(elapsed)} · {EXERCISES[exercise].label}</Text>
            <Pressable onPress={() => setFront((value) => !value)} accessibilityLabel="Cambiar de cámara" style={styles.voice}>
              <RotateCcw size={20} color={colors.textMuted} />
            </Pressable>
            <Pressable onPress={toggleVoice} accessibilityLabel={voice ? 'Silenciar voz' : 'Activar voz'} accessibilityRole="switch" accessibilityState={{ checked: voice }} style={styles.voice}>
              {voice ? <Volume2 size={20} color={colors.good} /> : <VolumeX size={20} color={colors.textMuted} />}
            </Pressable>
          </View>
        </View>
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  content: { paddingHorizontal: 20 },
  stack: { gap: 16 },
  head: { paddingHorizontal: 20, gap: 4, marginBottom: 12 },
  headRep: { alignSelf: 'stretch', marginTop: 6 },
  pick: { minWidth: 104, minHeight: 56, paddingHorizontal: 14, paddingVertical: 8, borderRadius: radii.md, borderWidth: 1, borderColor: colors.line, backgroundColor: colors.surface, justifyContent: 'center' },
  pickOn: { backgroundColor: colors.cobalt, borderColor: colors.cobalt },
  railWrap: { flexGrow: 0, marginBottom: 12 },
  rail: { paddingHorizontal: 20, gap: 8 },
  camera: { flex: 1, marginHorizontal: 20, borderRadius: radii.lg, borderWidth: 1, borderColor: colors.line, backgroundColor: colors.field, overflow: 'hidden', justifyContent: 'center' },
  cameraLive: { marginHorizontal: 12 },
  placeholder: { alignItems: 'center', gap: 10, paddingHorizontal: 28 },
  camIcon: { width: 60, height: 60, borderRadius: radii.lg, backgroundColor: colors.surfaceHigh, alignItems: 'center', justifyContent: 'center', marginBottom: 4 },
  center: { textAlign: 'center' },
  cameraTop: { position: 'absolute', top: 12, left: 12, right: 12, flexDirection: 'row', justifyContent: 'space-between' },
  pill: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: colors.scrim, borderRadius: radii.xs, paddingHorizontal: 10, paddingVertical: 6 },
  pillText: { fontSize: 10.5, letterSpacing: 0.8 },
  dot: { width: 8, height: 8, borderRadius: 2 },
  countdown: { ...StyleSheet.absoluteFill, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.scrim },
  countNumber: { fontSize: 100, lineHeight: 104 },
  hud: { position: 'absolute', left: 12, right: 12, bottom: 12, gap: 10 },
  hudRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end' },
  bigNumber: { fontSize: 96, lineHeight: 100 },
  techBadge: { backgroundColor: colors.scrim, borderRadius: radii.md, paddingHorizontal: 14, paddingVertical: 8, alignItems: 'flex-end' },
  feedback: { flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: colors.scrim, borderRadius: radii.md, paddingHorizontal: 14, paddingVertical: 12, minHeight: 48 },
  feedbackText: { flex: 1 },
  controls: { paddingHorizontal: 20, paddingTop: 16, gap: 12 },
  statusRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  flex: { flex: 1 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  voice: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
  target: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 14 },
})
