import { router } from 'expo-router'
import { ArrowRight, CalendarDays, Flame, Play } from 'lucide-react-native'
import { useMemo } from 'react'
import { StyleSheet, View } from 'react-native'
import { SyncBadge } from '../../components/SyncBadge'
import { catalogLabel } from '../../lib/catalog'
import { firstName, greeting } from '../../lib/format'
import { currentWeek } from '../../lib/profile'
import { weeklyProgress } from '../../lib/stats'
import { buildWeekPlan, todayIndex } from '../../lib/weeklyPlan'
import { routineNote } from '../../lib/contract'
import { useAuth } from '../../state/auth'
import { useData } from '../../state/data'
import { useRoutine, useStats } from '../../state/queries'
import { colors, fonts, radii } from '../../theme'
import { Button } from '../../ui/Button'
import { BibTile, Card } from '../../ui/Card'
import { Meter, Ring } from '../../ui/Charts'
import { Pressable } from '../../ui/Pressable'
import { Reveal, Screen, SectionTitle } from '../../ui/Screen'
import { ErrorState, ScreenSkeleton } from '../../ui/States'
import { Text } from '../../ui/Text'

export default function Home() {
  const { user } = useAuth()
  const { body } = useData()
  const { stats, loading, error, refresh, refreshing, fromLocal, offline } = useStats()
  const routine = useRoutine()

  const today = useMemo(() => {
    if (!body || !user) return null
    return buildWeekPlan(body, user.level, currentWeek(body)).days[todayIndex()]
  }, [body, user])

  const startToday = () => {
    const engine = today?.items.find((item) => item.engine)?.engine
    router.navigate({ pathname: '/train', params: engine ? { exercise: engine } : {} })
  }

  if (loading) {
    return (
      <Screen title={`${greeting()}${user ? `, ${firstName(user.name)}` : ''}`} eyebrow="Inicio">
        <ScreenSkeleton />
      </Screen>
    )
  }

  const progress = stats ? weeklyProgress(stats) : { reps: 0, percent: 0 }

  return (
    <Screen
      eyebrow="Inicio"
      title={`${greeting()}${user ? `, ${firstName(user.name)}` : ''}`}
      refreshing={refreshing}
      onRefresh={refresh}
    >
      <Reveal index={0}>
        <SyncBadge />
      </Reveal>

      {error && !stats ? <ErrorState message={error.message} offline={offline} onRetry={refresh} /> : null}

      <Reveal index={1}>
        <View style={styles.hero}>
          <View style={styles.heroTop}>
            <Text variant="label" color={colors.textMuted}>
              {today ? (today.kind === 'train' ? `Hoy · ${today.name}` : `Hoy · ${today.name} de descanso`) : 'Hoy'}
            </Text>
            <View style={styles.streak} accessible accessibilityLabel={`Racha de ${stats?.streakDays ?? 0} días`}>
              <Flame size={16} color={colors.vermilion} fill={colors.vermilion} />
              <Text variant="bodyStrong" style={{ fontFamily: fonts.displayBold }}>{stats?.streakDays ?? 0}</Text>
              <Text variant="small" color={colors.textMuted}>{stats?.streakDays === 1 ? 'día' : 'días'}</Text>
            </View>
          </View>
          <Text variant="headline">{today ? today.title : 'Listo para entrenar'}</Text>
          <Text color={colors.textMuted} numberOfLines={3}>
            {today?.kind === 'train'
              ? `${today.items.length} ejercicios · unos ${today.minutes} min. ${today.focus}`
              : today
                ? 'Camina o haz algo de movilidad. Descansar también es parte del plan.'
                : 'Elige un ejercicio y deja que la cámara cuente y corrija.'}
          </Text>
          <Button
            label={today?.kind === 'train' ? 'Empezar el entrenamiento' : 'Entrenar igualmente'}
            onPress={startToday}
            large
            icon={<Play size={18} color="#0a0c12" fill="#0a0c12" />}
          />
        </View>
      </Reveal>

      <Reveal index={2}>
        <Card style={styles.goal}>
          <Ring percent={progress.percent} size={112}>
            <Text variant="title" style={{ fontFamily: fonts.display }}>{progress.percent}%</Text>
          </Ring>
          <View style={styles.goalText}>
            <Text variant="label" color={colors.cobaltText}>Meta semanal</Text>
            <Text variant="title">{progress.reps} de 120 repeticiones</Text>
            <Meter percent={progress.percent} color={colors.vermilion} />
            <Text variant="small" color={colors.textMuted}>
              {progress.percent >= 100 ? 'Meta cumplida. Todo lo extra suma.' : 'Cada repetición con buena técnica cuenta.'}
            </Text>
          </View>
        </Card>
      </Reveal>

      <Reveal index={3} style={styles.tiles}>
        <BibTile label="Sesiones" value={stats?.totalSessions ?? 0} band="cobalt" />
        <BibTile label="Precisión" value={stats?.avgAccuracy ?? 0} suffix="%" band="ink" />
      </Reveal>
      <Reveal index={4} style={styles.tiles}>
        <BibTile label="Repeticiones" value={stats?.totalReps ?? 0} band="ink" />
        <BibTile label="Calorías" value={stats?.totalCalories ?? 0} suffix="kcal" band="cobalt" />
      </Reveal>
      {fromLocal ? (
        <Text variant="small" color={colors.textSubtle}>Estas cifras vienen de las sesiones guardadas en el teléfono.</Text>
      ) : null}

      {routine.data ? (
        <Reveal index={5} style={styles.block}>
          <SectionTitle trailing={<Text variant="small" color={colors.textSubtle}>Rutina adaptativa</Text>}>Tu siguiente paso</SectionTitle>
          {routine.data.items.slice(0, 3).map((item) => {
            const engine = ['squat', 'push_up', 'plank', 'deadlift', 'lunge'].includes(item.exercise) ? item.exercise : undefined
            return (
              <Pressable
                key={item.exercise}
                disabled={!engine}
                onPress={() => router.navigate({ pathname: '/train', params: { exercise: engine! } })}
                accessibilityLabel={`${catalogLabel(item.exercise)}, ${item.sets} series de ${item.reps}`}
                style={styles.step}
              >
                <View style={styles.stepIndex}>
                  <CalendarDays size={18} color={colors.cobaltText} />
                </View>
                <View style={styles.stepText}>
                  <Text variant="bodyStrong">{catalogLabel(item.exercise)}</Text>
                  <Text variant="small" color={colors.textMuted} numberOfLines={2}>
                    {item.sets} × {item.reps} · {routineNote(item.note)}
                  </Text>
                </View>
                {engine ? <ArrowRight size={18} color={colors.textMuted} /> : null}
              </Pressable>
            )
          })}
        </Reveal>
      ) : null}
    </Screen>
  )
}

const styles = StyleSheet.create({
  hero: { backgroundColor: colors.field, borderRadius: radii.lg, borderWidth: 1, borderColor: colors.line, padding: 20, gap: 14 },
  heroTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  streak: { flexDirection: 'row', alignItems: 'center', gap: 5, backgroundColor: colors.signalWash, borderRadius: radii.xs, paddingHorizontal: 10, paddingVertical: 5 },
  goal: { flexDirection: 'row', alignItems: 'center', gap: 18 },
  goalText: { flex: 1, gap: 8 },
  tiles: { flexDirection: 'row', gap: 12 },
  block: { gap: 12 },
  step: { flexDirection: 'row', alignItems: 'center', gap: 14, backgroundColor: colors.surface, borderRadius: radii.md, borderWidth: 1, borderColor: colors.line, padding: 14, minHeight: 64 },
  stepIndex: { width: 40, height: 40, borderRadius: radii.sm, backgroundColor: colors.cobaltWash, alignItems: 'center', justifyContent: 'center' },
  stepText: { flex: 1, gap: 2 },
})
