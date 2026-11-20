import Constants from 'expo-constants'
import { router } from 'expo-router'
import { LogOut, Pencil, RefreshCw } from 'lucide-react-native'
import { useState } from 'react'
import { Alert, StyleSheet, View } from 'react-native'
import { SyncBadge } from '../../components/SyncBadge'
import { API_URL } from '../../lib/config'
import { levelLabel, LEVELS } from '../../lib/contract'
import { initials } from '../../lib/format'
import { bmi, bmiCategory, currentWeek, goalName } from '../../lib/profile'
import { nutritionTargets } from '../../lib/nutrition'
import type { Level } from '../../lib/types'
import { useAuth } from '../../state/auth'
import { useData } from '../../state/data'
import { colors, fonts, radii } from '../../theme'
import { Button } from '../../ui/Button'
import { BibTile, Card } from '../../ui/Card'
import { Segmented } from '../../ui/Controls'
import { haptic } from '../../ui/haptics'
import { Reveal, Screen, SectionTitle } from '../../ui/Screen'
import { Notice } from '../../ui/States'
import { Text } from '../../ui/Text'

export default function Profile() {
  const { user, guest, logout, updateProfile } = useAuth()
  const { body, pending, sync, online } = useData()
  const [error, setError] = useState('')
  const [syncing, setSyncing] = useState(false)

  if (!user) return null

  const changeLevel = async (level: Level) => {
    setError('')
    try {
      await updateProfile({ level })
      haptic.success()
    } catch {
      haptic.error()
      setError('No se pudo guardar el nivel. Revisa tu conexión.')
    }
  }

  const confirmLogout = () =>
    Alert.alert(
      'Cerrar sesión',
      pending ? `Tienes ${pending} sesión(es) sin subir. Se conservan en este teléfono y se subirán cuando vuelvas a entrar.` : '¿Seguro que quieres salir?',
      [
        { text: 'Cancelar', style: 'cancel' },
        { text: 'Cerrar sesión', style: 'destructive', onPress: () => void logout() },
      ],
    )

  const retrySync = async () => {
    setSyncing(true)
    try {
      await sync()
    } finally {
      setSyncing(false)
    }
  }

  const targets = body ? nutritionTargets(body) : null
  const index = body ? bmi(body) : null

  return (
    <Screen title="Perfil" eyebrow="Tu cuenta">
      <Reveal index={0}>
        <View style={styles.id}>
          <View style={styles.avatar} accessibilityElementsHidden>
            <Text variant="headline" color={colors.onCobalt}>{initials(user.name)}</Text>
          </View>
          <View style={styles.flex}>
            <Text variant="title" numberOfLines={1}>{user.name}</Text>
            <Text variant="small" color={colors.textMuted} numberOfLines={1}>{guest ? 'Cuenta de invitado' : (user.email ?? '')}</Text>
          </View>
        </View>
      </Reveal>

      {guest ? <Notice tone="info">Eres invitado: tus sesiones se guardan, pero si cierras sesión no podrás recuperar la cuenta. Crea una cuenta para conservarlas.</Notice> : null}

      {body ? (
        <Reveal index={1} style={styles.block}>
          <SectionTitle trailing={<Text variant="small" color={colors.textMuted}>Semana {currentWeek(body)}</Text>}>Tu plan</SectionTitle>
          <Card style={styles.plan}>
            <Text variant="bodyStrong">{goalName(body.goal)}</Text>
            <Text variant="small" color={colors.textMuted}>
              {body.weightKg} kg · {body.heightCm} cm{body.targetWeightKg ? ` · meta ${body.targetWeightKg} kg` : ''} · {body.daysPerWeek} días por semana
            </Text>
            <Button label="Editar mi plan" variant="ghost" onPress={() => router.push('/edit-body')} icon={<Pencil size={16} color={colors.text} />} />
          </Card>
          <View style={styles.tiles}>
            <BibTile label="IMC" value={index ?? 0} foot={index ? bmiCategory(index) : undefined} band="cobalt" />
            <BibTile label="Meta diaria" value={targets?.kcal ?? 0} suffix="kcal" band="ink" />
          </View>
        </Reveal>
      ) : null}

      <Reveal index={2} style={styles.block}>
        <SectionTitle>Nivel de entrenamiento</SectionTitle>
        <Segmented options={LEVELS.map((level) => ({ value: level, label: levelLabel(level) }))} value={user.level} onChange={(level) => void changeLevel(level)} />
        {error ? <Notice tone="error">{error}</Notice> : null}
      </Reveal>

      <Reveal index={3} style={styles.block}>
        <SectionTitle>Sincronización</SectionTitle>
        <Card style={styles.plan}>
          <Text variant="small" color={colors.textMuted}>
            {!online ? 'Sin conexión. Tus sesiones se guardan aquí y se suben solas cuando vuelva.' : pending ? `${pending} sesión(es) esperando para subir.` : 'Todo está al día con el servidor.'}
          </Text>
          <SyncBadge />
          {pending ? <Button label="Subir ahora" variant="ghost" onPress={() => void retrySync()} loading={syncing} disabled={!online} icon={<RefreshCw size={16} color={colors.text} />} /> : null}
        </Card>
      </Reveal>

      <Reveal index={4} style={styles.block}>
        <Button label="Cerrar sesión" variant="danger" onPress={confirmLogout} icon={<LogOut size={18} color={colors.signalText} />} />
        <Text variant="small" color={colors.textSubtle} style={styles.version}>
          FitMentor {Constants.expoConfig?.version ?? '1.0.0'} · {API_URL.replace(/^https?:\/\//, '')}
        </Text>
      </Reveal>
    </Screen>
  )
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  block: { gap: 12 },
  id: { flexDirection: 'row', alignItems: 'center', gap: 16 },
  avatar: { width: 64, height: 64, borderRadius: radii.lg, backgroundColor: colors.cobalt, alignItems: 'center', justifyContent: 'center' },
  plan: { gap: 12 },
  tiles: { flexDirection: 'row', gap: 12 },
  version: { textAlign: 'center', fontFamily: fonts.body },
})
