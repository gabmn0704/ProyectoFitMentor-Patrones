import { Tabs } from 'expo-router'
import type { ComponentProps } from 'react'
import { CalendarDays, ChartNoAxesColumn, Dumbbell, House, MessageCircle, UserRound } from 'lucide-react-native'
import { useState } from 'react'
import { StyleSheet, View } from 'react-native'
import Animated, { useAnimatedStyle, withSpring } from 'react-native-reanimated'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { colors, radii } from '../../theme'
import { useKeyboardVisible } from '../../ui/useKeyboard'
import { haptic } from '../../ui/haptics'
import { Pressable } from '../../ui/Pressable'
import { Text } from '../../ui/Text'

type BottomTabBarProps = Parameters<NonNullable<ComponentProps<typeof Tabs>['tabBar']>>[0]

const TABS: Record<string, { label: string; Icon: typeof House }> = {
  index: { label: 'Inicio', Icon: House },
  train: { label: 'Entrenar', Icon: Dumbbell },
  plan: { label: 'Plan', Icon: CalendarDays },
  progress: { label: 'Progreso', Icon: ChartNoAxesColumn },
  coach: { label: 'Coach', Icon: MessageCircle },
  profile: { label: 'Perfil', Icon: UserRound },
}

/** Barra inferior de tinta con bloque cobalto deslizante, como en la web. */
function TabBar({ state, navigation }: BottomTabBarProps) {
  const insets = useSafeAreaInsets()
  const keyboard = useKeyboardVisible()
  const [width, setWidth] = useState(0)
  const slot = width / state.routes.length
  const thumb = useAnimatedStyle(() => ({ transform: [{ translateX: withSpring(state.index * slot, { damping: 20, stiffness: 240 }) }] }))
  if (keyboard) return null
  return (
    <View style={[styles.bar, { paddingBottom: Math.max(insets.bottom, 8) }]}>
      <View style={styles.inner} onLayout={(event) => setWidth(event.nativeEvent.layout.width)}>
        {width > 0 ? <Animated.View style={[styles.thumb, { width: slot - 6 }, thumb]} /> : null}
        {state.routes.map((route, index) => {
          const tab = TABS[route.name]
          if (!tab) return null
          const focused = state.index === index
          const color = focused ? colors.onCobalt : colors.textMuted
          return (
            <Pressable
              key={route.key}
              feedback={false}
              pressScale={0.92}
              accessibilityRole="tab"
              accessibilityLabel={tab.label}
              accessibilityState={{ selected: focused }}
              onPress={() => {
                const event = navigation.emit({ type: 'tabPress', target: route.key, canPreventDefault: true })
                if (!focused && !event.defaultPrevented) {
                  haptic.tap()
                  navigation.navigate(route.name, route.params)
                }
              }}
              style={styles.item}
            >
              <tab.Icon size={21} color={color} strokeWidth={focused ? 2.4 : 1.9} />
              <Text variant="label" color={color} style={styles.label} numberOfLines={1}>
                {tab.label}
              </Text>
            </Pressable>
          )
        })}
      </View>
    </View>
  )
}

export default function TabsLayout() {
  return (
    <Tabs tabBar={(props) => <TabBar {...props} />} screenOptions={{ headerShown: false, sceneStyle: { backgroundColor: colors.bg } }}>
      <Tabs.Screen name="index" />
      <Tabs.Screen name="train" />
      <Tabs.Screen name="plan" />
      <Tabs.Screen name="progress" />
      <Tabs.Screen name="coach" />
      <Tabs.Screen name="profile" />
    </Tabs>
  )
}

const styles = StyleSheet.create({
  bar: { position: 'absolute', left: 0, right: 0, bottom: 0, backgroundColor: colors.field, borderTopWidth: 1, borderTopColor: colors.line, paddingTop: 8, paddingHorizontal: 6 },
  inner: { flexDirection: 'row' },
  thumb: { position: 'absolute', top: 0, bottom: 0, left: 3, backgroundColor: colors.cobalt, borderRadius: radii.sm },
  item: { flex: 1, minHeight: 56, alignItems: 'center', justifyContent: 'center', gap: 3 },
  label: { fontSize: 9.5, letterSpacing: 0.3, textTransform: 'none' },
})
