import { Tabs } from 'expo-router'
import type { ComponentProps } from 'react'
import { CalendarDays, ChartNoAxesColumn, Dumbbell, House, MessageCircle, UserRound } from 'lucide-react-native'
import { useState } from 'react'
import { StyleSheet, View } from 'react-native'
import Animated, { useAnimatedStyle, withSpring } from 'react-native-reanimated'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { colors } from '../../theme'
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
  const slot = (width - 10) / state.routes.length
  const thumb = useAnimatedStyle(() => ({ transform: [{ translateX: withSpring(state.index * slot, { damping: 15, stiffness: 200 }) }] }))
  if (keyboard) return null
  return (
    <View style={[styles.bar, { paddingBottom: Math.max(insets.bottom, 10) }]} pointerEvents="box-none">
      <View style={styles.inner} onLayout={(event) => setWidth(event.nativeEvent.layout.width)}>
        {width > 0 ? <Animated.View style={[styles.thumb, { width: slot }, thumb]} /> : null}
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
  bar: { position: 'absolute', left: 0, right: 0, bottom: 0, paddingHorizontal: 14 },
  inner: { flexDirection: 'row', backgroundColor: 'rgba(12,20,16,0.96)', borderRadius: 30, borderWidth: 1, borderColor: colors.lineStrong, padding: 5, shadowColor: '#19e3a1', shadowOpacity: 0.3, shadowRadius: 20, shadowOffset: { width: 0, height: 6 }, elevation: 14 },
  thumb: { position: 'absolute', top: 5, bottom: 5, left: 5, backgroundColor: colors.cobalt, borderRadius: 24, shadowColor: '#19e3a1', shadowOpacity: 0.7, shadowRadius: 12, shadowOffset: { width: 0, height: 0 } },
  item: { flex: 1, minHeight: 54, alignItems: 'center', justifyContent: 'center', gap: 3 },
  label: { fontSize: 9.5, letterSpacing: 0.3, textTransform: 'none' },
})
