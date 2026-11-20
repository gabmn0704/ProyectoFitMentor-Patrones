import { Send, Sparkles } from 'lucide-react-native'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useFocusEffect } from 'expo-router'
import { FlatList, KeyboardAvoidingView, Platform, StyleSheet, TextInput, View } from 'react-native'
import Animated, { FadeInUp, useReducedMotion } from 'react-native-reanimated'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { ApiError, warmUpBackend } from '../../lib/api'
import { localCoachAnswer } from '../../lib/coachLocal'
import { coachProfilePayload, coachSuggestions, coachWelcome } from '../../lib/coachProfile'
import { coachSourceLabel, LIMITS, toCoachSource } from '../../lib/contract'
import { coachApi } from '../../lib/services'
import { kv } from '../../lib/storage'
import type { CoachSource } from '../../lib/types'
import { useAuth } from '../../state/auth'
import { useData } from '../../state/data'
import { colors, fonts, radii } from '../../theme'
import { Chip } from '../../ui/Controls'
import { haptic } from '../../ui/haptics'
import { Mascot } from '../../ui/Mascot'
import { Pressable } from '../../ui/Pressable'
import { Skeleton } from '../../ui/States'
import { Text } from '../../ui/Text'
import { useKeyboardVisible } from '../../ui/useKeyboard'

type Message = { id: string; role: 'user' | 'coach'; text: string; source?: CoachSource | 'offline'; error?: boolean }

const OFFLINE_LABEL = 'Guía local · sin conexión con el coach'

const storeKey = (userId: string) => `fitmentor.coach.${userId}`

export default function Coach() {
  const { token, user } = useAuth()
  const { body } = useData()
  const insets = useSafeAreaInsets()
  const reduced = useReducedMotion()
  const keyboard = useKeyboardVisible()
  const [messages, setMessages] = useState<Message[]>([])
  const [draft, setDraft] = useState('')
  const [sending, setSending] = useState(false)
  const [ready, setReady] = useState(false)
  const list = useRef<FlatList<Message>>(null)

    // Despierta el backend (y con él la IA) al entrar: en Render puede tardar hasta un minuto.
  useFocusEffect(useCallback(() => warmUpBackend(), []))

  const welcome = useMemo(() => coachWelcome(user?.name, body?.goal), [user?.name, body?.goal])
  const suggestions = useMemo(() => coachSuggestions(body?.goal), [body?.goal])

  useEffect(() => {
    if (!user) return
    void kv.getJSON<Message[]>(storeKey(user.id), []).then((saved) => {
      setMessages(Array.isArray(saved) ? saved.filter((m) => !m.error) : [])
      setReady(true)
    })
  }, [user])

  const persist = useCallback(
    (next: Message[]) => {
      if (user) void kv.setJSON(storeKey(user.id), next.slice(-40))
    },
    [user],
  )

  const ask = async (text: string) => {
    const question = text.trim().slice(0, LIMITS.coachQuestion)
    if (!question || sending || !token) return
    haptic.light()
    const withQuestion: Message[] = [...messages, { id: `u-${Date.now()}`, role: 'user', text: question }]
    setMessages(withQuestion)
    setDraft('')
    setSending(true)
    try {
      const history = messages.filter((m) => !m.error && m.source !== 'offline').map((m) => ({ role: m.role, text: m.text }))
      const answer = await coachApi.ask(token, question, { profile: body ? coachProfilePayload(body) : undefined, history })
      const next: Message[] = [...withQuestion, { id: `c-${Date.now()}`, role: 'coach', text: answer.answer, source: toCoachSource(answer.source) }]
      setMessages(next)
      persist(next)
      haptic.tap()
    } catch (reason) {
      // Sin red, servidor caído o sin la IA: el chat sigue respondiendo con la guía local (igual que la web).
      const unreachable = reason instanceof ApiError && (reason.status === 0 || reason.status === 404 || reason.status >= 500)
      if (unreachable) {
        haptic.warn()
        const next: Message[] = [
          ...withQuestion,
          { id: `o-${Date.now()}`, role: 'coach', text: localCoachAnswer(question, body ? coachProfilePayload(body) : undefined), source: 'offline' },
        ]
        setMessages(next)
        persist(next)
        return
      }
      haptic.error()
      const message = reason instanceof ApiError ? reason.message : 'No pude responder ahora. Inténtalo de nuevo.'
      setMessages([...withQuestion, { id: `e-${Date.now()}`, role: 'coach', text: message, error: true }])
    } finally {
      setSending(false)
    }
  }

  const data: Message[] = [{ id: 'welcome', role: 'coach', text: welcome, source: 'rules' }, ...messages]

  return (
    <KeyboardAvoidingView style={[styles.root, { paddingTop: insets.top + 12 }]} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <View style={styles.head}>
        <Mascot state={sending ? 'count' : messages.length ? 'idle' : 'wave'} size={68} interactive />
        <View style={styles.headText}>
          <Text variant="label" color={colors.cobaltText}>Coach · Rep</Text>
          <Text variant="title" accessibilityRole="header">Pregúntale a tu coach</Text>
        </View>
      </View>

      <FlatList
        ref={list}
        data={ready ? data : []}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        onContentSizeChange={() => list.current?.scrollToEnd({ animated: true })}
        ListEmptyComponent={<Skeleton height={72} radius={radii.lg} />}
        ListFooterComponent={
          <View style={styles.footer}>
            {sending ? (
              <View style={[styles.bubble, styles.coach]} accessibilityLabel="El coach está escribiendo" accessibilityLiveRegion="polite">
                <Skeleton width={120} height={14} />
              </View>
            ) : null}
            {messages.length === 0 && !sending ? (
              <View style={styles.suggestions}>
                {suggestions.map((suggestion) => (
                  <Chip key={suggestion} label={suggestion} onPress={() => void ask(suggestion)} style={styles.suggestion} />
                ))}
              </View>
            ) : null}
          </View>
        }
        renderItem={({ item }) => (
          <Animated.View entering={reduced ? undefined : FadeInUp.duration(260)} style={[styles.bubble, item.role === 'user' ? styles.user : item.error ? styles.error : styles.coach]}>
            {item.role === 'coach' && !item.error && item.source ? (
              <View style={styles.source}>
                <Sparkles size={12} color={colors.cobaltText} />
                <Text variant="label" color={colors.cobaltText} style={styles.sourceText}>{item.source === 'offline' ? OFFLINE_LABEL : coachSourceLabel(item.source)}</Text>
              </View>
            ) : null}
            <Text selectable color={item.role === 'user' ? colors.onCobalt : item.error ? colors.dangerText : colors.text} style={styles.bubbleText}>{item.text}</Text>
          </Animated.View>
        )}
      />

      <View style={[styles.composer, { paddingBottom: keyboard ? 10 : 92 + insets.bottom }]}>
        <TextInput
          value={draft}
          onChangeText={setDraft}
          placeholder="Escribe tu pregunta"
          placeholderTextColor={colors.textSubtle}
          accessibilityLabel="Pregunta para el coach"
          multiline
          maxLength={LIMITS.coachQuestion}
          selectionColor={colors.cobaltText}
          cursorColor={colors.vermilion}
          style={styles.input}
          onSubmitEditing={() => void ask(draft)}
        />
        <Pressable onPress={() => void ask(draft)} disabled={!draft.trim() || sending} accessibilityLabel="Enviar pregunta" style={[styles.send, { opacity: draft.trim() && !sending ? 1 : 0.45 }]}>
          <Send size={20} color="#0a0c12" />
        </Pressable>
      </View>
    </KeyboardAvoidingView>
  )
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  head: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 20, marginBottom: 8 },
  headText: { flex: 1, gap: 2 },
  list: { paddingHorizontal: 20, paddingTop: 8, gap: 12, flexGrow: 1 },
  footer: { gap: 12 },
  bubble: { maxWidth: '88%', borderRadius: 22, paddingHorizontal: 16, paddingVertical: 12, gap: 6 },
  coach: { alignSelf: 'flex-start', backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.line, borderTopLeftRadius: radii.xs },
  user: { alignSelf: 'flex-end', backgroundColor: colors.cobalt, borderTopRightRadius: radii.xs, shadowColor: '#19e3a1', shadowOpacity: 0.4, shadowRadius: 12, shadowOffset: { width: 0, height: 4 }, elevation: 4 },
  error: { alignSelf: 'flex-start', backgroundColor: colors.dangerWash, borderWidth: 1, borderColor: 'rgba(255,125,143,0.4)' },
  bubbleText: { fontSize: 15.5, lineHeight: 23 },
  source: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  sourceText: { fontSize: 10.5, letterSpacing: 0.8 },
  suggestions: { gap: 8, alignItems: 'flex-start' },
  suggestion: { minHeight: 44, height: undefined, paddingVertical: 10 },
  composer: { flexDirection: 'row', alignItems: 'flex-end', gap: 10, paddingHorizontal: 16, paddingTop: 10, borderTopWidth: 1, borderTopColor: colors.line, backgroundColor: colors.bg },
  input: { flex: 1, minHeight: 48, maxHeight: 120, backgroundColor: colors.surface, borderRadius: 24, borderWidth: 1.5, borderColor: colors.lineStrong, paddingHorizontal: 14, paddingVertical: 12, color: colors.text, fontFamily: fonts.body, fontSize: 16 },
  send: { width: 48, height: 48, borderRadius: 24, backgroundColor: colors.vermilion, alignItems: 'center', justifyContent: 'center', shadowColor: '#d4ff3a', shadowOpacity: 0.6, shadowRadius: 12, shadowOffset: { width: 0, height: 0 }, elevation: 8 },
})
