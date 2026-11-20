import { useState } from 'react'
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, View } from 'react-native'
import Animated, { FadeInDown, useReducedMotion } from 'react-native-reanimated'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { ArrowRight, Eye, EyeOff } from 'lucide-react-native'
import { ApiError } from '../lib/api'
import { useAuth } from '../state/auth'
import { colors, radii } from '../theme'
import { Button } from '../ui/Button'
import { Field, Segmented } from '../ui/Controls'
import { haptic } from '../ui/haptics'
import { Logo } from '../ui/Logo'
import { Pressable } from '../ui/Pressable'
import { Notice } from '../ui/States'
import { Text } from '../ui/Text'

type Mode = 'login' | 'register'

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export default function LoginScreen() {
  const { login, register, continueAsGuest } = useAuth()
  const insets = useSafeAreaInsets()
  const reduced = useReducedMotion()
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

  return (
    <KeyboardAvoidingView style={styles.root} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView
        contentContainerStyle={[styles.content, { paddingTop: insets.top + 36, paddingBottom: insets.bottom + 32 }]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <Animated.View entering={reduced ? undefined : FadeInDown.duration(500)} style={styles.hero}>
          <Logo size={64} />
          <Text variant="display" accessibilityRole="header">
            Entrena con{'\n'}técnica real.
          </Text>
          <Text color={colors.textMuted}>
            La cámara de tu teléfono mide tu postura en el momento. Sin enviar tu video a ningún sitio.
          </Text>
        </Animated.View>

        <Animated.View entering={reduced ? undefined : FadeInDown.delay(120).duration(500)} style={styles.bib}>
          <View style={styles.band}>
            <View style={styles.hole} />
            <Text variant="label" color={colors.onCobalt}>
              {mode === 'login' ? 'Inicia sesión' : 'Crea tu cuenta'}
            </Text>
          </View>
          <View style={styles.form}>
            <Segmented
              options={[
                { value: 'login', label: 'Entrar' },
                { value: 'register', label: 'Registrarme' },
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
            <Button label={mode === 'login' ? 'Entrar' : 'Crear cuenta'} onPress={submit} loading={busy === 'form'} disabled={busy === 'guest'} large icon={<ArrowRight size={20} color="#0a0c12" />} />
          </View>
        </Animated.View>

        <Animated.View entering={reduced ? undefined : FadeInDown.delay(220).duration(500)} style={styles.guest}>
          <Text variant="small" color={colors.textMuted} style={styles.center}>
            ¿Solo quieres probar? Tus sesiones se guardan igual en este teléfono.
          </Text>
          <Button label="Continuar como invitado" variant="ghost" onPress={() => void run('guest', () => continueAsGuest())} loading={busy === 'guest'} disabled={busy === 'form'} />
          <Text variant="small" color={colors.textSubtle} style={styles.center}>
            El servidor puede tardar hasta un minuto en despertar la primera vez.
          </Text>
        </Animated.View>
      </ScrollView>
    </KeyboardAvoidingView>
  )
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  content: { paddingHorizontal: 20, gap: 28 },
  hero: { gap: 16 },
  bib: { backgroundColor: colors.field, borderRadius: radii.lg, borderWidth: 1, borderColor: colors.line, overflow: 'hidden' },
  band: { height: 40, backgroundColor: colors.cobalt, flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 14 },
  hole: { width: 11, height: 11, borderRadius: 6, backgroundColor: colors.bg },
  form: { padding: 18, gap: 16 },
  eye: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center', marginRight: -10 },
  guest: { gap: 12 },
  center: { textAlign: 'center' },
})
