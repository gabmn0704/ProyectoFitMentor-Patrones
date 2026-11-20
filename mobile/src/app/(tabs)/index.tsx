import { router } from 'expo-router'
import { ArrowRight, Bot, CalendarDays, Dumbbell, Play } from 'lucide-react-native'
import { useEffect, useMemo, useRef } from 'react'
import { StyleSheet, View } from 'react-native'
import { BadgeStrip, ChallengesCard, GoalCard, StreakCard } from '../../components/home/Sections'
import { useWeeklyGoal } from '../../components/home/useWeeklyGoal'
import { SyncBadge } from '../../components/SyncBadge'
import { catalogLabel } from '../../lib/catalog'
import { routineNote } from '../../lib/contract'
import {
  badgeStatus,
  dayKey,
  levelFromXp,
  sessionsOn,
  streakFromSessions,
  todayChallenges,
  totalXp,
  weekDays,
  weeklyGoalProgress,
} from '../../lib/engagement'
import { firstName, greeting } from '../../lib/format'
import type { MascotState } from '../../lib/mascot'
import { currentWeek } from '../../lib/profile'
import { buildWeekPlan, todayIndex } from '../../lib/weeklyPlan'
import { useAuth } from '../../state/auth'
import { useData } from '../../state/data'
import { useRoutine, useStats } from '../../state/queries'
import { colors, radii } from '../../theme'
import { Button } from '../../ui/Button'
import { haptic } from '../../ui/haptics'
import { Mascot } from '../../ui/Mascot'
import { MentorQuote } from '../../ui/MentorQuote'
import { Pressable } from '../../ui/Pressable'
import { Reveal, Screen, SectionTitle } from '../../ui/Screen'
import { ErrorState, ScreenSkeleton } from '../../ui/States'
import { Text } from '../../ui/Text'

export default function Home() {
  const { user } = useAuth()
  const { body, sessions } = useData()
  const { stats, loading, error, refresh, refreshing, fromLocal, offline } = useStats()
  const routine = useRoutine()
  const { goal, change } = useWeeklyGoal(user?.id)

  const today = useMemo(() => {
    if (!body || !user) return null
    return buildWeekPlan(body, user.level, currentWeek(body)).days[todayIndex()]
  }, [body, user])

  const engage = useMemo(() => {
    const now = new Date()
    const streak = streakFromSessions(sessions, now)
    const challenges = todayChallenges(sessions, now)
    const challengesDone = challenges.filter((c) => c.done).length
    const badges = badgeStatus({ sessions, streakDays: streak, challengesDone })
    // Los retos de días anteriores no se guardan: la XP usa las sesiones y los retos de hoy.
    const todayDone = { [dayKey(now)]: challenges.filter((c) => c.done).map((c) => c.challenge.id) }
    return {
      streak,
      challenges,
      badges,
      days: weekDays(sessions, now),
      level: levelFromXp(totalXp(sessions, todayDone)),
      trainedToday: sessionsOn(sessions, now).length > 0,
    }
  }, [sessions])

  const weekly = weeklyGoalProgress(sessions, goal)
  const mood: MascotState = engage.trainedToday ? 'celebrate' : sessions.length && engage.streak === 0 ? 'worried' : 'wave'
  const heroMessage = engage.trainedToday
    ? 'Sesión de hoy completada. Gran trabajo.'
    : engage.streak === 0 && sessions.length
      ? 'Un mal día no borra tu progreso. Empecemos suave.'
      : today?.kind === 'rest'
        ? 'Hoy toca recuperar. Camina o haz movilidad.'
        : 'Hola. Vamos a entrenar con buena técnica.'

  // Celebra una sola vez cuando se desbloquea una medalla nueva durante la sesión de la app.
  const unlockedCount = engage.badges.filter((b) => b.unlocked).length
  const seen = useRef<number | null>(null)
  useEffect(() => {
    if (seen.current !== null && unlockedCount > seen.current) haptic.success()
    seen.current = unlockedCount
  }, [unlockedCount])

  const startToday = () => {
    haptic.medium()
    const engine = today?.items.find((item) => item.engine)?.engine
    router.navigate({ pathname: '/train', params: engine ? { exercise: engine } : {} })
  }

  const title = `${greeting()}${user ? `, ${firstName(user.name)}` : ''}`

  if (loading) {
    return (
      <Screen title={title} eyebrow="Inicio">
        <ScreenSkeleton />
      </Screen>
    )
  }

  const trains = today?.kind === 'train'

  return (
    <Screen eyebrow="Inicio" title={title} refreshing={refreshing} onRefresh={refresh}>
      <Reveal index={0}>
        <SyncBadge />
      </Reveal>

      {error && !stats ? <ErrorState message={error.message} offline={offline} onRetry={refresh} /> : null}

      <Reveal index={1}>
        <View style={styles.hero}>
          <View style={styles.glow} pointerEvents="none" />
          <Mascot state={mood} size={132} message={heroMessage} placement="right" interactive style={styles.rep} />
          <MentorQuote userId={user?.id} />
          <View style={styles.today}>
            <Text variant="label" color={colors.cobaltText}>
              {today ? (trains ? `Hoy · ${today.name}` : `Hoy · ${today.name} de descanso`) : 'Hoy'}
            </Text>
            <Text variant="headline">{today ? today.title : 'Listo para entrenar'}</Text>
            <Text color={colors.textMuted} numberOfLines={3}>
              {trains
                ? `${today.items.length} ejercicios · unos ${today.minutes} min. ${today.focus}`
                : today
                  ? 'Descansar también es parte del plan.'
                  : 'Elige un ejercicio y deja que la cámara cuente y corrija.'}
            </Text>
          </View>
          <Button
            label={trains ? 'Empezar el entrenamiento' : 'Entrenar igualmente'}
            onPress={startToday}
            large
            icon={<Play size={18} color="#0a0c12" fill="#0a0c12" />}
          />
        </View>
      </Reveal>

      <Reveal index={2}>
        <StreakCard streak={engage.streak} days={engage.days} level={engage.level} />
      </Reveal>

      <Reveal index={3}>
        <GoalCard done={weekly.done} goal={weekly.goal} percent={weekly.percent} reached={weekly.reached} onChange={change} />
      </Reveal>

      <Reveal index={4} style={styles.block}>
        <SectionTitle trailing={<Text variant="small" color={colors.textSubtle}>{engage.challenges.filter((c) => c.done).length}/3 hoy</Text>}>Retos del día</SectionTitle>
        <ChallengesCard
          rows={engage.challenges.map((c) => ({ id: c.challenge.id, title: c.challenge.title, percent: c.percent, done: c.done, xp: c.challenge.xp }))}
        />
      </Reveal>

      <Reveal index={5} style={styles.block}>
        <SectionTitle trailing={<Text variant="small" color={colors.textSubtle}>{unlockedCount}/{engage.badges.length}</Text>}>Medallas</SectionTitle>
        <BadgeStrip items={engage.badges} />
      </Reveal>

      <Reveal index={6} style={styles.quick}>
        <QuickLink icon={<Dumbbell size={22} color={colors.onCobalt} />} label="Entrenar" onPress={() => router.navigate('/train')} primary />
        <QuickLink icon={<CalendarDays size={22} color={colors.cobaltText} />} label="Plan" onPress={() => router.navigate('/plan')} />
        <QuickLink icon={<Bot size={22} color={colors.cobaltText} />} label="Coach" onPress={() => router.navigate('/coach')} />
      </Reveal>

      {routine.data ? (
        <Reveal index={7} style={styles.block}>
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

      {fromLocal ? <Text variant="small" color={colors.textSubtle}>Estas cifras vienen de las sesiones guardadas en el teléfono.</Text> : null}
    </Screen>
  )
}

function QuickLink({ icon, label, onPress, primary }: { icon: React.ReactNode; label: string; onPress: () => void; primary?: boolean }) {
  return (
    <Pressable onPress={onPress} accessibilityLabel={label} style={[styles.quickItem, primary && styles.quickPrimary]}>
      <View style={[styles.quickIcon, primary && styles.quickIconPrimary]}>{icon}</View>
      <Text variant="bodyStrong">{label}</Text>
    </Pressable>
  )
}

const styles = StyleSheet.create({
  hero: { backgroundColor: colors.field, borderRadius: radii.xl, borderWidth: 1, borderColor: colors.line, padding: 18, gap: 16, overflow: 'hidden' },
  glow: { position: 'absolute', top: -60, left: -40, width: 220, height: 220, borderRadius: 110, backgroundColor: colors.cobaltWash },
  rep: { alignSelf: 'stretch' },
  today: { gap: 6 },
  block: { gap: 12 },
  quick: { flexDirection: 'row', gap: 12 },
  quickItem: { flex: 1, alignItems: 'center', gap: 8, backgroundColor: colors.surface, borderRadius: radii.lg, borderWidth: 1, borderColor: colors.line, paddingVertical: 16, minHeight: 88 },
  quickPrimary: { backgroundColor: colors.cobaltWash, borderColor: 'rgba(25,227,161,0.35)' },
  quickIcon: { width: 44, height: 44, borderRadius: 22, backgroundColor: colors.surfaceHigh, alignItems: 'center', justifyContent: 'center' },
  quickIconPrimary: { backgroundColor: colors.cobalt },
  step: { flexDirection: 'row', alignItems: 'center', gap: 14, backgroundColor: colors.surface, borderRadius: radii.md, borderWidth: 1, borderColor: colors.line, padding: 14, minHeight: 64 },
  stepIndex: { width: 40, height: 40, borderRadius: radii.sm, backgroundColor: colors.cobaltWash, alignItems: 'center', justifyContent: 'center' },
  stepText: { flex: 1, gap: 2 },
})
