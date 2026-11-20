import { Geist_400Regular, Geist_500Medium, Geist_600SemiBold, Geist_700Bold } from '@expo-google-fonts/geist'
import { Outfit_600SemiBold, Outfit_700Bold, Outfit_800ExtraBold, useFonts } from '@expo-google-fonts/outfit'
import { Stack } from 'expo-router'
import * as SplashScreen from 'expo-splash-screen'
import { StatusBar } from 'expo-status-bar'
import { useEffect } from 'react'
import { SafeAreaProvider } from 'react-native-safe-area-context'
import { AuthProvider, useAuth } from '../state/auth'
import { DataProvider, useData } from '../state/data'
import { colors } from '../theme'
import { IntroSplash } from '../ui/IntroSplash'

SplashScreen.preventAutoHideAsync().catch(() => undefined)

function Gate() {
  const { status } = useAuth()
  const { body } = useData()
  const ready = status !== 'loading' && !(status === 'signedIn' && body === undefined)

  useEffect(() => {
    if (ready) SplashScreen.hideAsync().catch(() => undefined)
  }, [ready])

  if (!ready) return null
  const signedIn = status === 'signedIn'
  return (
    <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: colors.bg }, animation: 'fade' }}>
      <Stack.Protected guard={!signedIn}>
        <Stack.Screen name="login" />
      </Stack.Protected>
      <Stack.Protected guard={signedIn && body === null}>
        <Stack.Screen name="onboarding" />
      </Stack.Protected>
      <Stack.Protected guard={signedIn && Boolean(body)}>
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="edit-body" options={{ presentation: 'modal', animation: 'slide_from_bottom' }} />
      </Stack.Protected>
    </Stack>
  )
}

export default function RootLayout() {
  const [loaded, fontError] = useFonts({
    Outfit_600SemiBold,
    Outfit_700Bold,
    Outfit_800ExtraBold,
    Geist_400Regular,
    Geist_500Medium,
    Geist_600SemiBold,
    Geist_700Bold,
  })
  // Si una fuente falla se sigue con la del sistema: nunca bloquear la app por tipografía.
  if (!loaded && !fontError) return null
  return (
    <SafeAreaProvider>
      <StatusBar style="light" />
      <AuthProvider>
        <DataProvider>
          <Gate />
          <IntroSplash />
        </DataProvider>
      </AuthProvider>
    </SafeAreaProvider>
  )
}
