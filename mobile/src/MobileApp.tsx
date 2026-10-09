import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { StatusBar } from 'expo-status-bar'
import * as Speech from 'expo-speech'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { Camera, useCameraDevice, useCameraPermission, useFrameOutput } from 'react-native-vision-camera'
import { useResizer } from 'react-native-vision-camera-resizer'
import { useTensorflowModel } from 'react-native-fast-tflite'
import { scheduleOnRN } from 'react-native-worklets'
import { Activity, Camera as CameraIcon, Check, Dumbbell, History, Pause, Play, Save, Settings, ShieldCheck, Volume2, VolumeX, Zap } from 'lucide-react-native'
import { SafeAreaView, ScrollView, StyleSheet, Text, TouchableOpacity, View, useColorScheme } from 'react-native'
import { advanceRepPhase, analyzePose, type Exercise, type PosePoint, type RepPhase } from './pose-analysis'

type Tab = 'Entrenar' | 'Progreso' | 'Ajustes'
type ThemeChoice = 'system' | 'light' | 'dark'
type SavedSession = { exercise: string; amount: number; unit: string; score: number; date: string }

const modelSource = { url: 'https://www.kaggle.com/models/google/movenet/tfLite/singlepose-lightning/1?lite-format=tflite' }
const historyKey = 'fitmentor-mobile-history'
const themeKey = 'fitmentor-mobile-theme'
const voiceKey = 'fitmentor-mobile-voice'
const exercises: Array<{ id: Exercise; title: string; target: number; unit: string }> = [
  { id: 'squat', title: 'Sentadilla', target: 12, unit: 'reps' },
  { id: 'push_up', title: 'Flexión', target: 10, unit: 'reps' },
  { id: 'plank', title: 'Plancha', target: 60, unit: 'seg' },
  { id: 'deadlift', title: 'Peso muerto', target: 10, unit: 'reps' },
]

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

export default function MobileApp() {
  const systemScheme = useColorScheme()
  const [tab, setTab] = useState<Tab>('Entrenar')
  const [exercise, setExercise] = useState<Exercise>('squat')
  const [themeChoice, setThemeChoice] = useState<ThemeChoice>('system')
  const [voiceEnabled, setVoiceEnabled] = useState(true)
  const [history, setHistory] = useState<SavedSession[]>([])
  const [storageReady, setStorageReady] = useState(false)
  const [training, setTraining] = useState(false)
  const [seconds, setSeconds] = useState(0)
  const [reps, setReps] = useState(0)
  const [analysis, setAnalysis] = useState<ReturnType<typeof analyzePose>>(null)
  const [cameraError, setCameraError] = useState('')
  const lastAngle = useRef<number | null>(null)
  const phase = useRef<RepPhase>('ready')
  const totalReps = useRef(0)
  const lastFeedbackAt = useRef(0)
  const lastSpokenAt = useRef(0)
  const plankStartedAt = useRef<number | null>(null)
  const currentExercise = useRef(exercise)
  const { hasPermission, requestPermission } = useCameraPermission()
  const device = useCameraDevice('back')
  const modelState = useTensorflowModel(modelSource, [])
  const model = modelState.state === 'loaded' ? modelState.model : undefined
  const { resizer, error: resizerError } = useResizer({ width: 192, height: 192, channelOrder: 'rgb', dataType: 'float32', pixelLayout: 'interleaved', scaleMode: 'contain' })
  const isDark = themeChoice === 'dark' || (themeChoice === 'system' && systemScheme === 'dark')
  const colors = useMemo(() => isDark ? {
    background: '#101714', surface: '#1b2621', raised: '#24332b', text: '#edf2ed', muted: '#a0afa5', line: '#35453c', accent: '#c6e66c', accentInk: '#1c281e', coral: '#f08b72', camera: '#0a100d', nav: '#17211c', good: '#c6e66c',
  } : {
    background: '#f3f4ee', surface: '#ffffff', raised: '#edf3df', text: '#1d2925', muted: '#748079', line: '#e1e6dd', accent: '#c6e66c', accentInk: '#263321', coral: '#e67962', camera: '#101b16', nav: '#ffffff', good: '#61883b',
  }, [isDark])

  const receivePose = useCallback((points: PosePoint[]) => {
    const now = Date.now()
    const selected = currentExercise.current
    const result = analyzePose(points, selected)
    if (!result) {
      if (selected === 'plank') {
        plankStartedAt.current = null
        setSeconds(0)
      }
      if (now - lastFeedbackAt.current >= 300) {
        lastFeedbackAt.current = now
        setAnalysis(null)
      }
      return
    }
    if (selected === 'plank') {
      if (result.score >= 55) {
        plankStartedAt.current ??= now
        const elapsed = Math.floor((now - plankStartedAt.current) / 1000)
        setSeconds(value => value === elapsed ? value : elapsed)
      } else {
        plankStartedAt.current = null
        setSeconds(0)
      }
    }
    if (result.movementAngle !== null && selected !== 'plank') {
      const previous = lastAngle.current
      const filtered = previous === null ? result.movementAngle : previous * 0.7 + result.movementAngle * 0.3
      lastAngle.current = filtered
      const next = advanceRepPhase(selected, phase.current, filtered)
      phase.current = next.phase
      if (next.completed) {
        totalReps.current += 1
        setReps(totalReps.current)
        if (voiceEnabled && now - lastSpokenAt.current > 1800) {
          lastSpokenAt.current = now
          void Speech.speak('Repetición completada', { language: 'es-ES', rate: 1.05 })
        }
      }
    }
    if (now - lastFeedbackAt.current >= 180) {
      lastFeedbackAt.current = now
      setAnalysis(result)
      if (voiceEnabled && now - lastSpokenAt.current > 4500 && result.score < 72) {
        lastSpokenAt.current = now
        void Speech.speak(result.feedback, { language: 'es-ES', rate: 1 })
      }
    }
  }, [voiceEnabled])

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
        const input = inputPixels.buffer
        const outputs = model.runSync([input])
        if (outputs[0]) scheduleOnRN(receivePose, poseFromOutput(outputs[0]))
      } catch {
      } finally {
        frame.dispose()
      }
    },
  })

  useEffect(() => {
    let active = true
    void Promise.all([AsyncStorage.getItem(historyKey), AsyncStorage.getItem(themeKey), AsyncStorage.getItem(voiceKey)])
      .then(([savedHistory, savedTheme, savedVoice]) => {
        if (!active) return
        try { setHistory(savedHistory ? JSON.parse(savedHistory) as SavedSession[] : []) } catch { setHistory([]) }
        if (savedTheme === 'light' || savedTheme === 'dark' || savedTheme === 'system') setThemeChoice(savedTheme)
        if (savedVoice === 'off') setVoiceEnabled(false)
        setStorageReady(true)
      })
      .catch(() => setStorageReady(true))
    return () => { active = false }
  }, [])

  useEffect(() => {
    currentExercise.current = exercise
    lastAngle.current = null
    plankStartedAt.current = null
    phase.current = 'ready'
    totalReps.current = 0
    setReps(0)
    setSeconds(0)
    setAnalysis(null)
  }, [exercise])

  useEffect(() => {
    if (!storageReady) return
    void Promise.all([
      AsyncStorage.setItem(historyKey, JSON.stringify(history)),
      AsyncStorage.setItem(themeKey, themeChoice),
      AsyncStorage.setItem(voiceKey, voiceEnabled ? 'on' : 'off'),
    ])
  }, [history, storageReady, themeChoice, voiceEnabled])

  const selectedExercise = exercises.find(item => item.id === exercise)!
  const score = analysis?.score ?? 0
  const modelReady = modelState.state === 'loaded' && resizer !== null
  const modelMessage = modelState.state === 'loaded'
    ? resizerError ? 'No se pudo preparar la cámara.' : 'MoveNet listo · análisis en el teléfono'
    : modelState.state === 'error' ? 'No se pudo cargar MoveNet. Comprueba la conexión.' : 'Descargando el modelo de postura…'
  const amount = exercise === 'plank' ? seconds : reps
  const activeCamera = tab === 'Entrenar' && training && hasPermission && Boolean(device)
  const phaseLabel = exercise === 'plank' ? 'Mantén la postura' : phase.current === 'up' ? 'Posición alta' : phase.current === 'bottom' ? 'Profundidad' : phase.current === 'descending' ? 'Descendiendo' : 'Listo para iniciar'

  const toggleTraining = async () => {
    setCameraError('')
    if (training) { setTraining(false); plankStartedAt.current = null; void Speech.stop(); return }
    if (!hasPermission) {
      const permission = await requestPermission()
      if (!permission) { setCameraError('Permite el acceso a la cámara desde los ajustes del teléfono.'); return }
    }
    if (!device) { setCameraError('No se detectó una cámara disponible en el teléfono.'); return }
    setTraining(true)
  }

  const saveSession = () => {
    if (!amount) return
    setHistory(items => [{ exercise: selectedExercise.title, amount, unit: selectedExercise.unit, score, date: new Date().toLocaleDateString('es-ES') }, ...items].slice(0, 50))
    setTraining(false)
    setTab('Progreso')
  }

  const toggleVoice = () => setVoiceEnabled(value => !value)
  const setTheme = (value: ThemeChoice) => setThemeChoice(value)
  const navigateToTab = (next: Tab) => {
    if (next !== 'Entrenar' && training) {
      setTraining(false)
      plankStartedAt.current = null
    }
    setTab(next)
  }

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]}>
      <StatusBar style={isDark ? 'light' : 'dark'} />
      <View style={styles.page}>
        <View style={styles.header}>
          <View style={styles.brandRow}>
            <View style={[styles.brandIcon, { backgroundColor: colors.accent }]}><Zap size={18} color={colors.accentInk} fill={colors.accentInk} /></View>
            <View><Text style={[styles.brand, { color: colors.text }]}>fitmentor</Text><Text style={[styles.headerCaption, { color: colors.muted }]}>ENTRENAMIENTO INTELIGENTE</Text></View>
          </View>
          <View style={[styles.liveBadge, { backgroundColor: training ? '#fce4dc' : colors.raised }]}><View style={[styles.liveDot, { backgroundColor: training ? colors.coral : colors.muted }]} /><Text style={[styles.liveText, { color: training ? colors.coral : colors.muted }]}>{training ? 'EN VIVO' : 'LISTO'}</Text></View>
        </View>

        {tab === 'Entrenar' ? (
          <ScrollView contentContainerStyle={styles.trainContent} showsVerticalScrollIndicator={false}>
            <View style={styles.titleBlock}><Text style={[styles.eyebrow, { color: colors.muted }]}>COACH DE MOVIMIENTO</Text><Text style={[styles.title, { color: colors.text }]}>Entrena con{'\n'}<Text style={{ color: colors.good }}>precisión.</Text></Text><Text style={[styles.subtitle, { color: colors.muted }]}>La postura se analiza en el teléfono, sin transmitir video.</Text></View>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.exerciseRail}>
              {exercises.map(item => <TouchableOpacity key={item.id} onPress={() => setExercise(item.id)} style={[styles.exerciseChip, { backgroundColor: exercise === item.id ? colors.accent : colors.surface, borderColor: exercise === item.id ? colors.accent : colors.line }]}><Text style={[styles.exerciseChipText, { color: exercise === item.id ? colors.accentInk : colors.text }]}>{item.title}</Text></TouchableOpacity>)}
            </ScrollView>
            <View style={[styles.cameraCard, { backgroundColor: colors.camera, borderColor: colors.line }]}>
              {activeCamera && device ? <Camera style={StyleSheet.absoluteFill} device={device} isActive={activeCamera} outputs={[frameOutput]} /> : <View style={styles.cameraPlaceholder}><View style={styles.cameraIcon}><CameraIcon size={26} color="#eff5ec" /></View><Text style={styles.cameraTitle}>{training ? 'Preparando la cámara' : 'Coloca el teléfono a la altura de la cadera'}</Text><Text style={styles.cameraHint}>Deja el cuerpo completo dentro del encuadre y usa buena iluminación.</Text></View>}
              <View style={styles.cameraTopOverlay}><Text style={styles.cameraMode}>{modelReady ? 'IA EN EL DISPOSITIVO' : 'PREPARANDO IA'}</Text><ShieldCheck size={16} color="#d9edaa" /></View>
              {analysis && training && <View style={styles.posePill}><Check size={14} color="#24311e" /><Text style={styles.posePillText}>Pose detectada</Text></View>}
            </View>
            <View style={styles.cameraMessageRow}><Activity size={15} color={colors.good} /><Text style={[styles.modelMessage, { color: cameraError ? colors.coral : colors.muted }]}>{cameraError || (analysis ? analysis.feedback : modelMessage)}</Text></View>
            <View style={styles.liveMetrics}>
              <View style={[styles.liveMetric, { backgroundColor: colors.surface, borderColor: colors.line }]}><Text style={[styles.metricLabel, { color: colors.muted }]}>{exercise === 'plank' ? 'TIEMPO' : 'REPETICIONES'}</Text><Text style={[styles.metricNumber, { color: colors.text }]}>{exercise === 'plank' ? `${seconds}s` : reps}</Text><Text style={[styles.metricFoot, { color: colors.muted }]}>Meta: {selectedExercise.target} {selectedExercise.unit}</Text></View>
              <View style={[styles.liveMetric, { backgroundColor: colors.surface, borderColor: colors.line }]}><Text style={[styles.metricLabel, { color: colors.muted }]}>TÉCNICA</Text><Text style={[styles.metricNumber, { color: colors.text }]}>{score}<Text style={styles.percent}>%</Text></Text><Text style={[styles.metricFoot, { color: colors.muted }]}>{phaseLabel}</Text></View>
            </View>
            <View style={styles.controls}><TouchableOpacity onPress={() => void toggleTraining()} style={[styles.primaryButton, { backgroundColor: training ? colors.raised : colors.accent }]}>{training ? <Pause size={18} color={colors.text} fill={colors.text} /> : <Play size={18} color={colors.accentInk} fill={colors.accentInk} />}<Text style={[styles.primaryLabel, { color: training ? colors.text : colors.accentInk }]}>{training ? 'Pausar análisis' : hasPermission ? 'Iniciar sesión' : 'Permitir cámara y empezar'}</Text></TouchableOpacity>{training && <TouchableOpacity onPress={saveSession} disabled={!amount} style={[styles.saveButton, { backgroundColor: colors.surface, borderColor: colors.line, opacity: amount ? 1 : 0.5 }]}><Save size={17} color={colors.text} /><Text style={[styles.saveLabel, { color: colors.text }]}>Guardar</Text></TouchableOpacity>}</View>
          </ScrollView>
        ) : tab === 'Progreso' ? (
          <ScrollView contentContainerStyle={styles.secondaryContent} showsVerticalScrollIndicator={false}>
            <Text style={[styles.eyebrow, { color: colors.muted }]}>CONSTANCIA Y TÉCNICA</Text><Text style={[styles.pageTitle, { color: colors.text }]}>Tu progreso</Text>
            <View style={[styles.summaryStrip, { backgroundColor: colors.surface, borderColor: colors.line }]}><View><Text style={[styles.metricLabel, { color: colors.muted }]}>SESIONES</Text><Text style={[styles.summaryValue, { color: colors.text }]}>{history.length}</Text></View><View><Text style={[styles.metricLabel, { color: colors.muted }]}>MOVIMIENTOS</Text><Text style={[styles.summaryValue, { color: colors.text }]}>{history.reduce((sum, item) => sum + item.amount, 0)}</Text></View><View><Text style={[styles.metricLabel, { color: colors.muted }]}>ÚLTIMA TÉCNICA</Text><Text style={[styles.summaryValue, { color: colors.good }]}>{history[0]?.score ?? 0}%</Text></View></View>
            {history.length ? history.map((item, index) => <View key={`${item.date}-${index}`} style={[styles.historyRow, { borderBottomColor: colors.line }]}><View style={[styles.historyIcon, { backgroundColor: colors.raised }]}><Dumbbell size={17} color={colors.good} /></View><View style={styles.historyText}><Text style={[styles.historyExercise, { color: colors.text }]}>{item.exercise}</Text><Text style={[styles.historyDate, { color: colors.muted }]}>{item.date} · {item.amount} {item.unit}</Text></View><Text style={[styles.historyScore, { color: colors.good }]}>{item.score}%</Text></View>) : <View style={[styles.emptyState, { borderColor: colors.line }]}><History size={24} color={colors.muted} /><Text style={[styles.emptyTitle, { color: colors.text }]}>Sin sesiones todavía</Text><Text style={[styles.emptyHint, { color: colors.muted }]}>Guarda tu primer entrenamiento para verlo aquí.</Text></View>}
          </ScrollView>
        ) : (
          <ScrollView contentContainerStyle={styles.secondaryContent} showsVerticalScrollIndicator={false}>
            <Text style={[styles.eyebrow, { color: colors.muted }]}>PREFERENCIAS</Text><Text style={[styles.pageTitle, { color: colors.text }]}>Ajustes</Text>
            <View style={styles.settingBlock}><Text style={[styles.settingHeading, { color: colors.text }]}>Apariencia</Text><View style={[styles.segmented, { backgroundColor: colors.raised }]}>{(['system', 'light', 'dark'] as const).map(value => <TouchableOpacity key={value} onPress={() => setTheme(value)} style={[styles.segment, themeChoice === value && { backgroundColor: colors.surface }]}><Text style={[styles.segmentText, { color: themeChoice === value ? colors.text : colors.muted }]}>{value === 'system' ? 'Sistema' : value === 'light' ? 'Claro' : 'Oscuro'}</Text></TouchableOpacity>)}</View></View>
            <TouchableOpacity onPress={toggleVoice} style={[styles.settingRow, { borderBottomColor: colors.line }]}><View style={[styles.settingIcon, { backgroundColor: colors.raised }]}>{voiceEnabled ? <Volume2 size={19} color={colors.good} /> : <VolumeX size={19} color={colors.muted} />}</View><View style={styles.settingText}><Text style={[styles.settingHeading, { color: colors.text }]}>Correcciones por voz</Text><Text style={[styles.settingDescription, { color: colors.muted }]}>{voiceEnabled ? 'Activas durante el entrenamiento' : 'Desactivadas'}</Text></View><View style={[styles.switchTrack, { backgroundColor: voiceEnabled ? colors.good : colors.line }]}><View style={[styles.switchThumb, { alignSelf: voiceEnabled ? 'flex-end' : 'flex-start' }]} /></View></TouchableOpacity>
            <View style={[styles.privacyRow, { borderBottomColor: colors.line }]}><ShieldCheck size={20} color={colors.good} /><View style={styles.settingText}><Text style={[styles.settingHeading, { color: colors.text }]}>Privacidad local</Text><Text style={[styles.settingDescription, { color: colors.muted }]}>La cámara y el modelo de postura se procesan en este teléfono.</Text></View></View>
            <View style={[styles.privacyRow, { borderBottomColor: colors.line }]}><ShieldCheck size={20} color={colors.good} /><View style={styles.settingText}><Text style={[styles.settingHeading, { color: colors.text }]}>Motor de análisis</Text><Text style={[styles.settingDescription, { color: colors.muted }]}>{storageReady ? modelMessage : 'Preparando almacenamiento…'}</Text></View></View>
          </ScrollView>
        )}
        <View style={[styles.tabBar, { backgroundColor: colors.nav, borderTopColor: colors.line }]}>{([{ title: 'Entrenar' as const, icon: Dumbbell }, { title: 'Progreso' as const, icon: Activity }, { title: 'Ajustes' as const, icon: Settings }]).map(item => <TouchableOpacity key={item.title} onPress={() => navigateToTab(item.title)} style={styles.tabButton}><item.icon size={19} color={tab === item.title ? colors.good : colors.muted} strokeWidth={tab === item.title ? 2.5 : 1.8} /><Text style={[styles.tabLabel, { color: tab === item.title ? colors.good : colors.muted }]}>{item.title}</Text></TouchableOpacity>)}</View>
      </View>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  safeArea: { flex: 1 }, page: { flex: 1 },
  header: { minHeight: 66, paddingHorizontal: 20, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  brandRow: { flexDirection: 'row', alignItems: 'center', gap: 10 }, brandIcon: { width: 34, height: 34, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  brand: { fontSize: 18, fontWeight: '800', letterSpacing: 0.3 }, headerCaption: { marginTop: 2, fontSize: 8, fontWeight: '800', letterSpacing: 1.1 },
  liveBadge: { paddingHorizontal: 10, paddingVertical: 7, borderRadius: 20, flexDirection: 'row', alignItems: 'center', gap: 7 }, liveDot: { width: 7, height: 7, borderRadius: 4 }, liveText: { fontSize: 9, fontWeight: '800', letterSpacing: 0.7 },
  trainContent: { paddingHorizontal: 18, paddingBottom: 22, gap: 13 }, titleBlock: { paddingTop: 6, paddingBottom: 2 },
  eyebrow: { fontSize: 9, fontWeight: '800', letterSpacing: 1.3 }, title: { marginTop: 8, fontSize: 35, lineHeight: 38, fontWeight: '800' }, subtitle: { marginTop: 7, maxWidth: 340, fontSize: 12, lineHeight: 17 },
  exerciseRail: { gap: 8, paddingRight: 10 }, exerciseChip: { borderWidth: 1, paddingHorizontal: 13, paddingVertical: 10, borderRadius: 20 }, exerciseChipText: { fontSize: 11, fontWeight: '700' },
  cameraCard: { height: 340, borderWidth: 1, borderRadius: 16, overflow: 'hidden', justifyContent: 'center', alignItems: 'center' }, cameraPlaceholder: { paddingHorizontal: 28, alignItems: 'center', justifyContent: 'center' }, cameraIcon: { width: 56, height: 56, borderRadius: 18, backgroundColor: '#ffffff18', alignItems: 'center', justifyContent: 'center', marginBottom: 14 }, cameraTitle: { color: '#eff5ec', fontSize: 15, fontWeight: '700', textAlign: 'center' }, cameraHint: { marginTop: 7, color: '#a9b8ae', fontSize: 11, lineHeight: 16, textAlign: 'center' },
  cameraTopOverlay: { position: 'absolute', top: 12, left: 12, right: 12, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }, cameraMode: { color: '#e9f1e7', fontSize: 8, fontWeight: '800', letterSpacing: 1 },
  posePill: { position: 'absolute', left: 12, bottom: 12, borderRadius: 14, backgroundColor: '#c6e66c', paddingHorizontal: 10, paddingVertical: 7, flexDirection: 'row', alignItems: 'center', gap: 6 }, posePillText: { color: '#24311e', fontSize: 10, fontWeight: '800' }, cameraMessageRow: { minHeight: 26, flexDirection: 'row', alignItems: 'center', gap: 7 }, modelMessage: { flex: 1, fontSize: 10, lineHeight: 15 },
  liveMetrics: { flexDirection: 'row', gap: 10 }, liveMetric: { flex: 1, minHeight: 82, borderWidth: 1, borderRadius: 12, padding: 12 }, metricLabel: { fontSize: 8, fontWeight: '800', letterSpacing: 0.8 }, metricNumber: { marginTop: 4, fontSize: 27, fontWeight: '800' }, percent: { fontSize: 15 }, metricFoot: { marginTop: 2, fontSize: 9 },
  controls: { flexDirection: 'row', gap: 9 }, primaryButton: { flex: 1, minHeight: 48, borderRadius: 12, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 9 }, primaryLabel: { fontSize: 12, fontWeight: '800' }, saveButton: { minHeight: 48, paddingHorizontal: 13, borderWidth: 1, borderRadius: 12, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 7 }, saveLabel: { fontSize: 11, fontWeight: '700' },
  secondaryContent: { paddingHorizontal: 20, paddingTop: 26, paddingBottom: 28 }, pageTitle: { marginTop: 6, marginBottom: 20, fontSize: 32, fontWeight: '800' }, summaryStrip: { padding: 15, borderWidth: 1, borderRadius: 14, flexDirection: 'row', justifyContent: 'space-between' }, summaryValue: { marginTop: 5, fontSize: 24, fontWeight: '800' },
  historyRow: { minHeight: 72, borderBottomWidth: 1, flexDirection: 'row', alignItems: 'center', gap: 11 }, historyIcon: { width: 36, height: 36, borderRadius: 11, alignItems: 'center', justifyContent: 'center' }, historyText: { flex: 1 }, historyExercise: { fontSize: 13, fontWeight: '700' }, historyDate: { marginTop: 4, fontSize: 10 }, historyScore: { fontSize: 13, fontWeight: '800' }, emptyState: { marginTop: 15, padding: 24, borderWidth: 1, borderStyle: 'dashed', borderRadius: 14, alignItems: 'center' }, emptyTitle: { marginTop: 10, fontSize: 14, fontWeight: '700' }, emptyHint: { marginTop: 5, fontSize: 11, textAlign: 'center' },
  settingBlock: { marginTop: 10, marginBottom: 12 }, settingHeading: { fontSize: 13, fontWeight: '700' }, segmented: { marginTop: 10, padding: 4, borderRadius: 12, flexDirection: 'row' }, segment: { flex: 1, paddingVertical: 9, borderRadius: 9, alignItems: 'center' }, segmentText: { fontSize: 10, fontWeight: '700' }, settingRow: { minHeight: 74, borderBottomWidth: 1, flexDirection: 'row', alignItems: 'center', gap: 11 }, settingIcon: { width: 40, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center' }, settingText: { flex: 1 }, settingDescription: { marginTop: 4, fontSize: 10, lineHeight: 15 }, switchTrack: { width: 40, height: 23, padding: 3, borderRadius: 12, justifyContent: 'center' }, switchThumb: { width: 17, height: 17, borderRadius: 9, backgroundColor: '#ffffff' }, privacyRow: { minHeight: 72, borderBottomWidth: 1, flexDirection: 'row', alignItems: 'center', gap: 11 }, tabBar: { minHeight: 64, borderTopWidth: 1, flexDirection: 'row', paddingBottom: 3 }, tabButton: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 4 }, tabLabel: { fontSize: 9, fontWeight: '700' },
})
