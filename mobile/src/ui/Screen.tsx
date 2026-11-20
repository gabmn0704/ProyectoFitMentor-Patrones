import type { ReactNode } from 'react'
import { RefreshControl, ScrollView, StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native'
import Animated, { FadeInDown, useReducedMotion } from 'react-native-reanimated'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { colors } from '../theme'
import { Glow } from './Gradient'
import { Text } from './Text'

type Props = {
  children: ReactNode
  title?: string
  eyebrow?: string
  /** Contenido a la derecha del título (avatar, acción). */
  trailing?: ReactNode
  refreshing?: boolean
  onRefresh?: () => void
  /** Pantallas con teclado (chat) manejan su propio scroll. */
  scroll?: boolean
  contentStyle?: StyleProp<ViewStyle>
}

/** Contenedor de pestaña: margen seguro, cabecera y entrada escalonada. Deja sitio a la barra inferior. */
export function Screen({ children, title, eyebrow, trailing, refreshing, onRefresh, scroll = true, contentStyle }: Props) {
  const insets = useSafeAreaInsets()
  const reduced = useReducedMotion()
  const header = title ? (
    <Animated.View entering={reduced ? undefined : FadeInDown.duration(380)} style={styles.header}>
      <View style={styles.headerText}>
        {eyebrow ? (
          <View style={styles.eyebrow}>
            <View style={styles.eyebrowDot} />
            <Text variant="label" color={colors.cobaltText}>{eyebrow}</Text>
          </View>
        ) : null}
        <Text variant="headline" accessibilityRole="header" style={styles.title}>{title}</Text>
      </View>
      {trailing}
    </Animated.View>
  ) : null

  const ambient = (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      <Glow color="#19e3a1" size={420} opacity={0.22} style={{ top: -170, right: -150 }} />
      <Glow color="#d4ff3a" size={300} opacity={0.1} style={{ top: 360, left: -170 }} />
    </View>
  )

  if (!scroll) {
    return (
      <View style={[styles.root, { paddingTop: insets.top + 12 }]}>
        {ambient}
        {header}
        {children}
      </View>
    )
  }
  return (
    <View style={styles.root}>
      {ambient}
    <ScrollView
      style={styles.flex}
      contentContainerStyle={[styles.content, { paddingTop: insets.top + 12, paddingBottom: 112 + insets.bottom }, contentStyle]}
      showsVerticalScrollIndicator={false}
      keyboardShouldPersistTaps="handled"
      refreshControl={onRefresh ? <RefreshControl refreshing={Boolean(refreshing)} onRefresh={onRefresh} tintColor={colors.cobaltText} colors={[colors.cobalt]} progressBackgroundColor={colors.surfaceHigh} /> : undefined}
    >
      {header}
      {children}
    </ScrollView>
    </View>
  )
}

/** Aparición escalonada de bloques (transform + opacity). */
export function Reveal({ index = 0, children, style }: { index?: number; children: ReactNode; style?: StyleProp<ViewStyle> }) {
  const reduced = useReducedMotion()
  return (
    <Animated.View entering={reduced ? undefined : FadeInDown.delay(index * 80).duration(520).springify().damping(16)} style={style}>
      {children}
    </Animated.View>
  )
}

export function SectionTitle({ children, trailing }: { children: string; trailing?: ReactNode }) {
  return (
    <View style={styles.section}>
      <Text variant="title" accessibilityRole="header">{children}</Text>
      {trailing}
    </View>
  )
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  flex: { flex: 1 },
  eyebrow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  eyebrowDot: { width: 18, height: 3, borderRadius: 2, backgroundColor: colors.lime },
  title: { fontSize: 34, lineHeight: 37 },
  content: { paddingHorizontal: 20, gap: 20 },
  header: { flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between', gap: 12, paddingHorizontal: 20, marginBottom: 4 },
  headerText: { flex: 1, gap: 4 },
  section: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
})
