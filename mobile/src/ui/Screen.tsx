import type { ReactNode } from 'react'
import { RefreshControl, ScrollView, StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native'
import Animated, { FadeInDown, useReducedMotion } from 'react-native-reanimated'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { colors } from '../theme'
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
        {eyebrow ? <Text variant="label" color={colors.cobaltText}>{eyebrow}</Text> : null}
        <Text variant="headline" accessibilityRole="header">{title}</Text>
      </View>
      {trailing}
    </Animated.View>
  ) : null

  if (!scroll) {
    return (
      <View style={[styles.root, { paddingTop: insets.top + 12 }]}>
        {header}
        {children}
      </View>
    )
  }
  return (
    <ScrollView
      style={styles.root}
      contentContainerStyle={[styles.content, { paddingTop: insets.top + 12, paddingBottom: 112 + insets.bottom }, contentStyle]}
      showsVerticalScrollIndicator={false}
      keyboardShouldPersistTaps="handled"
      refreshControl={onRefresh ? <RefreshControl refreshing={Boolean(refreshing)} onRefresh={onRefresh} tintColor={colors.cobaltText} colors={[colors.cobalt]} progressBackgroundColor={colors.surfaceHigh} /> : undefined}
    >
      {header}
      {children}
    </ScrollView>
  )
}

/** Aparición escalonada de bloques (transform + opacity). */
export function Reveal({ index = 0, children, style }: { index?: number; children: ReactNode; style?: StyleProp<ViewStyle> }) {
  const reduced = useReducedMotion()
  return (
    <Animated.View entering={reduced ? undefined : FadeInDown.delay(index * 70).duration(420)} style={style}>
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
  content: { paddingHorizontal: 20, gap: 20 },
  header: { flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between', gap: 12, paddingHorizontal: 20, marginBottom: 4 },
  headerText: { flex: 1, gap: 4 },
  section: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
})
