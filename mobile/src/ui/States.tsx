import { useEffect, type ReactNode } from 'react'
import { StyleSheet, View, type DimensionValue, type StyleProp, type ViewStyle } from 'react-native'
import Animated, { useAnimatedStyle, useReducedMotion, useSharedValue, withRepeat, withSequence, withTiming } from 'react-native-reanimated'
import { AlertTriangle, WifiOff } from 'lucide-react-native'
import { colors, radii } from '../theme'
import { Button } from './Button'
import { Text } from './Text'

type SkeletonProps = { width?: DimensionValue; height?: number; radius?: number; style?: StyleProp<ViewStyle> }

/** Bloque de carga con pulso suave (estático si el sistema pide menos movimiento). */
export function Skeleton({ width = '100%', height = 16, radius = radii.sm, style }: SkeletonProps) {
  const reduced = useReducedMotion()
  const opacity = useSharedValue(0.5)
  useEffect(() => {
    if (reduced) return
    opacity.value = withRepeat(withSequence(withTiming(1, { duration: 800 }), withTiming(0.45, { duration: 800 })), -1)
  }, [opacity, reduced])
  const animated = useAnimatedStyle(() => ({ opacity: opacity.value }))
  return (
    <Animated.View
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
      style={[{ width, height, borderRadius: radius, backgroundColor: colors.surfaceHigh }, animated, style]}
    />
  )
}

/** Silueta de pantalla para la primera carga. */
export function ScreenSkeleton() {
  return (
    <View style={styles.skeleton} accessibilityLabel="Cargando" accessibilityRole="progressbar">
      <Skeleton width="55%" height={34} />
      <Skeleton height={132} radius={radii.lg} />
      <View style={styles.row}>
        <Skeleton height={104} radius={radii.lg} style={styles.flex} />
        <Skeleton height={104} radius={radii.lg} style={styles.flex} />
      </View>
      <Skeleton height={88} radius={radii.lg} />
    </View>
  )
}

type EmptyProps = { icon: ReactNode; title: string; hint: string; action?: { label: string; onPress: () => void } }

export function EmptyState({ icon, title, hint, action }: EmptyProps) {
  return (
    <View style={styles.empty} accessible accessibilityLabel={`${title}. ${hint}`}>
      <View style={styles.emptyIcon}>{icon}</View>
      <Text variant="title" style={styles.center}>{title}</Text>
      <Text variant="small" color={colors.textMuted} style={styles.center}>{hint}</Text>
      {action ? <Button label={action.label} onPress={action.onPress} variant="ghost" style={styles.emptyAction} /> : null}
    </View>
  )
}

type ErrorProps = { message: string; onRetry?: () => void; offline?: boolean }

/** Error recuperable: dice qué pasó en claro y ofrece reintentar. */
export function ErrorState({ message, onRetry, offline }: ErrorProps) {
  return (
    <View style={styles.empty} accessibilityRole="alert">
      <View style={[styles.emptyIcon, { backgroundColor: colors.dangerWash }]}>
        {offline ? <WifiOff size={26} color={colors.dangerText} /> : <AlertTriangle size={26} color={colors.dangerText} />}
      </View>
      <Text variant="title" style={styles.center}>{offline ? 'Sin conexión' : 'No pudimos cargar esto'}</Text>
      <Text variant="small" color={colors.textMuted} style={styles.center}>{message}</Text>
      {onRetry ? <Button label="Reintentar" onPress={onRetry} variant="ghost" style={styles.emptyAction} /> : null}
    </View>
  )
}

type NoticeProps = { tone?: 'info' | 'error' | 'ok'; children: ReactNode }

export function Notice({ tone = 'info', children }: NoticeProps) {
  const palette = {
    info: { bg: colors.cobaltWash, fg: colors.cobaltText },
    error: { bg: colors.dangerWash, fg: colors.dangerText },
    ok: { bg: colors.goodWash, fg: colors.good },
  }[tone]
  return (
    <View style={[styles.notice, { backgroundColor: palette.bg }]} accessibilityRole={tone === 'error' ? 'alert' : undefined}>
      <Text variant="small" color={palette.fg}>{children}</Text>
    </View>
  )
}

const styles = StyleSheet.create({
  skeleton: { gap: 16, padding: 20 },
  row: { flexDirection: 'row', gap: 12 },
  flex: { flex: 1 },
  empty: { alignItems: 'center', gap: 10, paddingVertical: 36, paddingHorizontal: 24 },
  emptyIcon: { width: 56, height: 56, borderRadius: radii.lg, backgroundColor: colors.surfaceHigh, alignItems: 'center', justifyContent: 'center', marginBottom: 4 },
  center: { textAlign: 'center' },
  emptyAction: { marginTop: 8, alignSelf: 'stretch' },
  notice: { borderRadius: radii.sm, paddingHorizontal: 14, paddingVertical: 10 },
})
