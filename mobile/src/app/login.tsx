import { useState } from 'react'
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, useWindowDimensions, View } from 'react-native'
import Animated, { FadeInDown, useReducedMotion } from 'react-native-reanimated'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import Svg, { Defs, RadialGradient, Rect, Stop } from 'react-native-svg'
import { ArrowRight, Eye, EyeOff, Lock, Mic, ScanLine } from 'lucide-react-native'
import { ApiError } from '../lib/api'
import { useAuth } from '../state/auth'
import { colors, fonts, radii } from '../theme'
import { Button } from '../ui/Button'
import { Field, Segmented } from '../ui/Controls'
import { haptic } from '../ui/haptics'
import { Logo } from '../ui/Logo'
import { Mascot } from '../ui/Mascot'
import { Pressable } from '../ui/Pressable'
import { Notice } from '../ui/States'
import { Text } from '../ui/Text'

type Mode = 'login' | 'register'

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

const PROOFS = [
  { icon: ScanLine, text: 'Postura corregida en tiempo real' },
  { icon: Mic, text: 'Conteo y guía por voz' },
]

/** Brillo esmeralda de fondo: un solo foco arriba y otro lima, muy tenue, abajo. */
function Glow({ width, height }: { width: number; height: number }) {
  return (
    <Svg width={width} height={height} style={StyleSheet.absoluteFill} pointerEvents="none">
      <Defs>
        <RadialGradient id="glow-a" cx="78%" cy="8%" rx="85%" ry="48%" fx="78%" fy="8%" gradientUnits="objectBoundingBox">
          <Stop offset="0" stopColor="#19e3a1" stopOpacity="0.38" />
          <Stop offset="0.55" stopColor="#0a7a53" stopOpacity="0.16" />
          <Stop offset="1" stopColor="#050a08" stopOpacity="0" />
        </RadialGradient>
        <RadialGradient id="glow-b" cx="-5%" cy="96%" rx="70%" ry="34%" fx="-5%" fy="96%" gradientUnits="objectBoundingBox">
          <Stop offset="0" stopColor="#d4ff3a" stopOpacity="0.14" />
          <Stop offset="1" stopColor="#050a08" stopOpacity="0" />
        </RadialGradient>
      </Defs>
      <Rect width={width} height={height} fill="url(#glow-a)" />
      <Rect width={width} height={height} fill="url(#glow-b)" />
    </Svg>
  )
}

export default function LoginScreen() {
  const { login, register, continueAsGuest } = useAuth()
  const insets = useSafeAreaInsets()
  const reduced = useReducedMotion()
  const { width, height } = useWindowDimensions()
  const [mode, setMode] = useState<Mode>('login')
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [show, setShow] = useState(false)
  const [busy, setBusy] = useState<'form' | 'guest' | null>(null)
  const [error, setError] = useState('')
  const [fieldErrors, setFieldErrors] = useState<{ name?: string; email?: string; password?: string }>({})

  const validate = () => {
    const next: typeof fieldErrors = {}
    if (mode === 'register' && name.trim().length < 2) next.name = 'Escribe tu nombre.'
    if (!EMAIL.test(email.trim())) next.email = 'Escribe un correo válido.'
    if (password.length < (mode === 'register' ? 8 : 1)) next.password = mode === 'register' ? 'Usa al menos 8 caracteres.' : 'Escribe tu contraseña.'
    setFieldErrors(next)
    return Object.keys(next).length === 0
  }

  const run = async (kind: 'form' | 'guest', action: () => Promise<void>) => {
    setError('')
    setBusy(kind)
    try {
      await action()
      haptic.success()
    } catch (reason) {
      haptic.error()
      setError(reason instanceof ApiError ? reason.message : 'Algo salió mal. Inténtalo de nuevo.')
    } finally {
      setBusy(null)
    }
  }

  const submit = () => {
    if (!validate()) return haptic.warn()
    void run('form', () => (mode === 'login' ? login(email, password) : register(name, email, password)))
  }

  const enter = (delay: number) => (reduced ? undefined : FadeInDown.delay(delay).duration(550))

  return (
    <KeyboardAvoidingView style={styles.root} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <Glow width={width} height={Math.max(height, 760)} />
      <ScrollView
        contentContainerStyle={[styles.content, { paddingTop: insets.top + 20, paddingBottom: insets.bottom + 28 }]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <Animated.View entering={enter(0)} style={styles.brand}>
          <Logo size={44} />
          <Text variant="title" style={styles.wordmark}>
            Fit<Text variant="title" color={colors.lime} style={styles.wordmark}>Mentor</Text>
          </Text>
        </Animated.View>

        <Animated.View entering={enter(80)} style={styles.hero}>
          <Text accessibilityRole="header" style={styles.title}>
            Entrena{'\n'}
            <Text style={[styles.title, styles.accent]}>bien.</Text>
          </Text>
          <Text color={colors.textMuted} style={styles.lede}>
            Tu coach con IA mira tu postura, cuenta tus repeticiones y te corrige al instante.
          </Text>
          <Mascot state="wave" size={84} message="Hola, soy Rep. Yo cuento, tú cuida la técnica." placement="right" interactive style={styles.rep} />
          <View style={styles.proofs}>
            {PROOFS.map(({ icon: Icon, text }) => (
              <View key={text} style={styles.proof}>
                <Icon size={15} color={colors.mint} strokeWidth={2.2} />
                <Text variant="small" color={colors.textMuted}>
                  {text}
                </Text>
              </View>
            ))}
          </View>
        </Animated.View>

        <Animated.View entering={enter(160)} style={styles.card}>
          <View style={styles.cardHead}>
            <View style={styles.kicker}>
              <View style={styles.kickerBar} />
              <Text variant="label" color={colors.mint}>
                Acceso
              </Text>
            </View>
            <View style={styles.secure}>
              <Lock size={12} color={colors.cobaltText} />
              <Text style={styles.secureText} color={colors.cobaltText}>
                Conexión cifrada
              </Text>
            </View>
          </View>

          <Text variant="headline" style={styles.cardTitle}>
            {mode === 'login' ? 'Bienvenido\nde nuevo' : 'Crea tu\ncuenta'}
          </Text>
          <Text variant="small" color={colors.textMuted}>
            {mode === 'login' ? 'Entra para seguir donde dejaste tu entrenamiento.' : 'Un minuto para registrarte y tu primera sesión queda lista.'}
          </Text>

          <View style={styles.form}>
            <Segmented
              options={[
                { value: 'login', label: 'Entrar' },
                { value: 'register', label: 'Crear cuenta' },
              ]}
              value={mode}
              onChange={(value) => {
                setMode(value)
                setError('')
                setFieldErrors({})
              }}
            />
            {mode === 'register' ? (
              <Field label="Nombre" value={name} onChangeText={setName} autoComplete="name" textContentType="name" autoCapitalize="words" error={fieldErrors.name} returnKeyType="next" />
            ) : null}
            <Field
              label="Correo"
              value={email}
              onChangeText={setEmail}
              placeholder="tu@correo.com"
              keyboardType="email-address"
              autoCapitalize="none"
              autoComplete="email"
              textContentType="emailAddress"
              error={fieldErrors.email}
              returnKeyType="next"
            />
            <Field
              label="Contraseña"
              value={password}
              onChangeText={setPassword}
              placeholder={mode === 'login' ? 'Tu contraseña' : 'Mínimo 8 caracteres'}
              secureTextEntry={!show}
              autoCapitalize="none"
              autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
              textContentType={mode === 'login' ? 'password' : 'newPassword'}
              error={fieldErrors.password}
              onSubmitEditing={submit}
              returnKeyType="go"
              right={
                <Pressable onPress={() => setShow((value) => !value)} accessibilityLabel={show ? 'Ocultar contraseña' : 'Mostrar contraseña'} style={styles.eye}>
                  {show ? <EyeOff size={20} color={colors.textMuted} /> : <Eye size={20} color={colors.textMuted} />}
                </Pressable>
              }
            />
            {error ? <Notice tone="error">{error}</Notice> : null}
            <Button
              label={mode === 'login' ? 'Entrar' : 'Crear cuenta'}
              onPress={submit}
              loading={busy === 'form'}
              disabled={busy === 'guest'}
              large
              style={styles.cta}
              icon={<ArrowRight size={20} color="#04140e" />}
            />
          </View>

          <View style={styles.divider}>
            <View style={styles.rule} />
            <Text variant="small" color={colors.textSubtle}>
              o continúa con
            </Text>
            <View style={styles.rule} />
          </View>

          <Button label="Entrar como invitado" variant="ghost" onPress={() => void run('guest', () => continueAsGuest())} loading={busy === 'guest'} disabled={busy === 'form'} large />
          <Text variant="small" color={colors.textSubtle} style={styles.center}>
            {busy === 'guest'
              ? 'Despertando el servidor, puede tardar hasta un minuto la primera vez…'
              : 'El modo invitado no necesita datos; tu progreso se guarda en este teléfono.'}
          </Text>
        </Animated.View>
      </ScrollView>
    </KeyboardAvoidingView>
  )
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  content: { paddingHorizontal: 20, gap: 26 },
  brand: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  wordmark: { fontFamily: fonts.displayBold, fontSize: 22, letterSpacing: -0.4 },
  hero: { gap: 14 },
  rep: { alignSelf: 'stretch' },
  title: { fontFamily: fonts.display, fontSize: 76, lineHeight: 74, letterSpacing: -3, color: colors.text },
  accent: { color: colors.lime },
  lede: { fontSize: 16, lineHeight: 24, maxWidth: 340 },
  proofs: { gap: 8, marginTop: 2 },
  proof: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  card: {
    gap: 14,
    padding: 20,
    borderRadius: radii.xl + 4,
    backgroundColor: 'rgba(15,24,20,0.82)',
    borderWidth: 1,
    borderColor: 'rgba(25,227,161,0.22)',
    shadowColor: '#19e3a1',
    shadowOpacity: 0.12,
    shadowRadius: 32,
    shadowOffset: { width: 0, height: 12 },
    elevation: 6,
  },
  cardHead: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  kicker: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  kickerBar: { width: 18, height: 2, borderRadius: 1, backgroundColor: colors.mint },
  secure: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: radii.pill,
    backgroundColor: colors.cobaltWash,
  },
  secureText: { fontFamily: fonts.bodySemi, fontSize: 11 },
  cardTitle: { fontSize: 34, lineHeight: 36, marginTop: 2 },
  form: { gap: 14, marginTop: 4 },
  cta: { borderRadius: radii.md, shadowColor: '#d4ff3a', shadowOpacity: 0.35, shadowRadius: 18, shadowOffset: { width: 0, height: 6 }, elevation: 4 },
  eye: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center', marginRight: -10 },
  divider: { flexDirection: 'row', alignItems: 'center', gap: 12, marginTop: 4 },
  rule: { flex: 1, height: 1, backgroundColor: colors.line },
  center: { textAlign: 'center' },
})
