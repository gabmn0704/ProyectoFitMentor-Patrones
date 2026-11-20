import { router } from 'expo-router'
import { Award, CloudUpload, Dumbbell, Flame } from 'lucide-react-native'
import { useMemo } from 'react'
import { StyleSheet, View } from 'react-native'
import { SyncBadge } from '../../components/SyncBadge'
import { achievementText, progressPercent } from '../../lib/contract'
import { exerciseLabel } from '../../lib/exercises'
import { formatDuration, formatShortDate, weekdayLabel } from '../../lib/format'
import { weeklyProgress } from '../../lib/stats'
import { useAchievements, useHistory, useStats } from '../../state/queries'
import { colors, fonts, radii } from '../../theme'
import { BibTile, Card } from '../../ui/Card'
import { CountUp, Lanes, LineChart, Meter } from '../../ui/Charts'
import { Mascot } from '../../ui/Mascot'
import { PageHero } from '../../ui/PageHero'
import { Reveal, Screen, SectionTitle } from '../../ui/Screen'
import { EmptyState, ErrorState, ScreenSkeleton } from '../../ui/States'
import { Text } from '../../ui/Text'

export default function Progress() {
  const { stats, loading, error, offline, refresh, refreshing, fromLocal } = useStats()
  const history = useHistory(30)
  const achievements = useAchievements()

  const lanes = useMemo(() => {
    const weekly = stats?.weekly ?? []
    const best = Math.max(0, ...weekly.map((day) => day.reps))
    return weekly.map((day) => ({ label: weekdayLabel(day.date), value: day.reps, best: best > 0 && day.reps === best }))
  }, [stats])

  if (loading) {
    return (
      <Screen title="Tu progreso" eyebrow="Constancia y técnica">
        <ScreenSkeleton />
      </Screen>
    )
  }
  if (!stats) {
    return (
      <Screen title="Tu progreso" eyebrow="Constancia y técnica" refreshing={refreshing} onRefresh={refresh}>
        <ErrorState message={error?.message ?? 'Inténtalo de nuevo.'} offline={offline} onRetry={refresh} />
      </Screen>
    )
  }

  const week = weeklyProgress(stats)
  const empty = stats.totalSessions === 0 && !history.entries?.length

  return (
    <Screen title="Tu progreso" eyebrow="Constancia y técnica" refreshing={refreshing} onRefresh={refresh}>
      <SyncBadge />
      {fromLocal ? <Text variant="small" color={colors.textSubtle}>Sin conexión: se muestran las sesiones guardadas en el teléfono.</Text> : null}

      <Reveal index={0}>
        <PageHero photo="deadlift"
          state={empty ? 'idle' : stats.streakDays >= 3 ? 'cheer' : stats.streakDays === 0 ? 'worried' : 'wave'}
          message={empty ? 'Aquí verás tu avance. Empecemos con una sesión.' : stats.streakDays >= 3 ? `${stats.streakDays} días seguidos. Esa constancia se nota.` : stats.streakDays === 0 ? 'Sin racha hoy. Una sesión corta la reactiva.' : 'Vas bien. Mañana sumamos otro día.'}
        >
          <View style={styles.streak}>
            <Flame size={30} color={colors.vermilion} fill={colors.vermilion} />
            <View style={styles.flex}>
              <Text variant="label" color={colors.textMuted}>Racha actual</Text>
              <View style={styles.streakRow}>
                <CountUp value={stats.streakDays} style={styles.streakNumber} />
                <Text variant="title" color={colors.textMuted}>{stats.streakDays === 1 ? 'día' : 'días'}</Text>
              </View>
            </View>
          </View>
        </PageHero>
      </Reveal>

      <Reveal index={1} style={styles.tiles}>
        <BibTile label="Sesiones" value={stats.totalSessions} band="cobalt" />
        <BibTile label="Repeticiones" value={stats.totalReps} band="ink" />
      </Reveal>
      <Reveal index={2} style={styles.tiles}>
        <BibTile label="Precisión" value={stats.avgAccuracy} suffix="%" band="ink" />
        <BibTile label="Calorías" value={stats.totalCalories} suffix="kcal" band="cobalt" />
      </Reveal>

      {empty ? (
        <EmptyState icon={<Mascot state="rest" size={72} />} title="Sin sesiones todavía" hint="Termina tu primer entrenamiento con la cámara y lo verás aquí." action={{ label: 'Ir a entrenar', onPress: () => router.navigate('/train') }} />
      ) : (
        <>
          <Reveal index={3} style={styles.block}>
            <SectionTitle trailing={<Text variant="small" color={colors.textMuted}>{week.reps} reps · {week.percent}% de la meta</Text>}>Últimos 7 días</SectionTitle>
            <Card>
              <Lanes data={lanes} />
            </Card>
          </Reveal>

          <Reveal index={4} style={styles.block}>
            <SectionTitle>Precisión por día</SectionTitle>
            <Card>
              <LineChart values={stats.weekly.map((day) => day.accuracy)} labels={stats.weekly.map((day) => weekdayLabel(day.date))} />
            </Card>
          </Reveal>

          {stats.byExercise.length ? (
            <Reveal index={5} style={styles.block}>
              <SectionTitle>Por ejercicio</SectionTitle>
              <Card style={styles.list}>
                {stats.byExercise.map((item) => (
                  <View key={item.exercise} style={styles.exercise}>
                    <View style={styles.exerciseTop}>
                      <Text variant="bodyStrong" style={styles.flex}>{exerciseLabel(item.exercise)}</Text>
                      <Text variant="small" color={colors.textMuted}>{item.reps} reps · {item.accuracy}%</Text>
                    </View>
                    <Meter percent={item.accuracy} color={item.accuracy >= 80 ? colors.good : colors.cobalt} />
                  </View>
                ))}
              </Card>
            </Reveal>
          ) : null}
        </>
      )}

      {achievements.data?.length ? (
        <Reveal index={6} style={styles.block}>
          <SectionTitle trailing={<Text variant="small" color={colors.textMuted}>{achievements.data.filter((a) => a.unlocked).length} de {achievements.data.length}</Text>}>Logros</SectionTitle>
          {achievements.data.map((achievement) => {
            const text = achievementText(achievement)
            const percent = progressPercent(achievement)
            return (
              <View key={achievement.id} style={[styles.achievement, achievement.unlocked && styles.achievementOn]} accessible accessibilityLabel={`${text.title}. ${text.description}. ${achievement.unlocked ? 'Desbloqueado' : `${percent} por ciento`}`}>
                <View style={[styles.badge, { backgroundColor: achievement.unlocked ? colors.vermilion : colors.surfaceHigh }]}>
                  <Award size={20} color={achievement.unlocked ? '#0a0c12' : colors.textMuted} />
                </View>
                <View style={styles.flex}>
                  <Text variant="bodyStrong">{text.title}</Text>
                  <Text variant="small" color={colors.textMuted}>{text.description}</Text>
                  {!achievement.unlocked ? <View style={styles.achievementMeter}><Meter percent={percent} /></View> : null}
                </View>
              </View>
            )
          })}
        </Reveal>
      ) : null}

      {history.entries?.length ? (
        <Reveal index={7} style={styles.block}>
          <SectionTitle>Historial</SectionTitle>
          {history.entries.slice(0, 20).map((entry) => (
            <View key={entry.id} style={styles.row} accessible accessibilityLabel={`${exerciseLabel(entry.exercise)}, ${formatShortDate(entry.date)}, ${entry.reps} repeticiones, ${entry.accuracy} por ciento`}>
              <View style={styles.rowIcon}><Dumbbell size={18} color={colors.cobaltText} /></View>
              <View style={styles.flex}>
                <Text variant="bodyStrong">{exerciseLabel(entry.exercise)}</Text>
                <Text variant="small" color={colors.textMuted}>{formatShortDate(entry.date)} · {entry.reps} {entry.exercise === 'plank' ? 's' : 'reps'} · {formatDuration(entry.durationSeconds)}</Text>
              </View>
              {!entry.synced ? <CloudUpload size={16} color={colors.cobaltText} /> : null}
              <Text variant="title" color={entry.accuracy >= 80 ? colors.good : colors.text} style={{ fontFamily: fonts.display }}>{entry.accuracy}%</Text>
            </View>
          ))}
        </Reveal>
      ) : null}
    </Screen>
  )
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  block: { gap: 12 },
  tiles: { flexDirection: 'row', gap: 12 },
  streak: { flexDirection: 'row', alignItems: 'center', gap: 16, backgroundColor: colors.signalWash, borderRadius: radii.xl, borderWidth: 1, borderColor: 'rgba(212,255,58,0.4)', padding: 18, shadowColor: '#d4ff3a', shadowOpacity: 0.3, shadowRadius: 16, shadowOffset: { width: 0, height: 6 }, elevation: 5 },
  streakRow: { flexDirection: 'row', alignItems: 'flex-end', gap: 8 },
  streakNumber: { fontSize: 64, lineHeight: 68, color: colors.lime },
  list: { gap: 16 },
  exercise: { gap: 8 },
  exerciseTop: { flexDirection: 'row', alignItems: 'center' },
  achievement: { flexDirection: 'row', gap: 14, backgroundColor: colors.surface, borderRadius: radii.xl, borderWidth: 1, borderColor: colors.line, padding: 14, alignItems: 'center' },
  achievementOn: { borderColor: 'rgba(255,125,102,0.5)' },
  achievementMeter: { marginTop: 8 },
  badge: { width: 48, height: 48, borderRadius: 24, alignItems: 'center', justifyContent: 'center' },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12, minHeight: 64, borderBottomWidth: 1, borderBottomColor: colors.line },
  rowIcon: { width: 38, height: 38, borderRadius: radii.sm, backgroundColor: colors.cobaltWash, alignItems: 'center', justifyContent: 'center' },
})
