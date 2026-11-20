import { Check, Flame, Lock, Minus, Plus, Trophy } from 'lucide-react-native'
import { ScrollView, StyleSheet, View } from 'react-native'
import type { Badge, WeekDay, levelFromXp } from '../../lib/engagement'
import { colors, fonts, radii } from '../../theme'
import { Card } from '../../ui/Card'
import { Meter, Ring } from '../../ui/Charts'
import { haptic } from '../../ui/haptics'
import { Pressable } from '../../ui/Pressable'
import { Text } from '../../ui/Text'

/** Racha + nivel + tira de la semana (L a D). */
export function StreakCard({ streak, days, level }: { streak: number; days: WeekDay[]; level: ReturnType<typeof levelFromXp> }) {
  return (
    <Card style={styles.streak}>
      <View style={styles.row}>
        <View style={styles.flame}>
          <Flame size={26} color={colors.vermilion} fill={streak > 0 ? colors.vermilion : 'transparent'} />
        </View>
        <View style={styles.grow} accessible accessibilityLabel={`Racha de ${streak} días`}>
          <Text variant="numeral" style={styles.streakNum}>{streak}</Text>
          <Text variant="small" color={colors.textMuted}>{streak === 1 ? 'día de racha' : 'días de racha'}</Text>
        </View>
        <View style={styles.levelBox} accessible accessibilityLabel={`Nivel ${level.level}, ${level.title}`}>
          <Text variant="label" color={colors.cobaltText}>Nivel {level.level}</Text>
          <Text variant="bodyStrong">{level.title}</Text>
        </View>
      </View>
      <View style={styles.week}>
        {days.map((day) => (
          <View key={day.key} style={styles.day} accessible accessibilityLabel={`${day.label}${day.today ? ' hoy' : ''}: ${day.active ? 'entrenaste' : 'sin sesión'}`}>
            <View style={[styles.dot, day.active && styles.dotOn, day.today && !day.active && styles.dotToday, day.future && styles.dotFuture]}>
              {day.active ? <Check size={16} color={colors.onCobalt} strokeWidth={3} /> : null}
            </View>
            <Text variant="label" color={day.today ? colors.text : colors.textSubtle}>{day.label}</Text>
          </View>
        ))}
      </View>
      <View style={styles.xp}>
        <Meter percent={level.percent} color={colors.cobalt} />
        <Text variant="small" color={colors.textSubtle}>{level.toNext} XP para el nivel {level.level + 1}</Text>
      </View>
    </Card>
  )
}

/** Meta semanal: anillo de sesiones con selector de objetivo. */
export function GoalCard({ done, goal, percent, reached, onChange }: { done: number; goal: number; percent: number; reached: boolean; onChange: (delta: number) => void }) {
  return (
    <Card style={styles.goal}>
      <Ring percent={percent} size={104} stroke={11}>
        <Text variant="title" style={{ fontFamily: fonts.display }}>{done}/{goal}</Text>
      </Ring>
      <View style={styles.grow}>
        <Text variant="label" color={colors.cobaltText}>Meta semanal</Text>
        <Text variant="title">{done} de {goal} sesiones</Text>
        <Text variant="small" color={colors.textMuted}>{reached ? 'Meta cumplida. Todo lo extra suma.' : `Te faltan ${goal - done} para cerrar la semana.`}</Text>
        <View style={styles.stepper}>
          <Pressable onPress={() => { haptic.tap(); onChange(-1) }} accessibilityLabel="Bajar la meta semanal" style={styles.stepBtn}>
            <Minus size={18} color={colors.text} />
          </Pressable>
          <Text variant="small" color={colors.textMuted}>Meta</Text>
          <Pressable onPress={() => { haptic.tap(); onChange(1) }} accessibilityLabel="Subir la meta semanal" style={styles.stepBtn}>
            <Plus size={18} color={colors.text} />
          </Pressable>
        </View>
      </View>
    </Card>
  )
}

export interface ChallengeRow {
  id: string
  title: string
  percent: number
  done: boolean
  xp: number
}

export function ChallengesCard({ rows }: { rows: ChallengeRow[] }) {
  return (
    <Card style={styles.challenges}>
      {rows.map((row) => (
        <View key={row.id} style={styles.challenge} accessible accessibilityLabel={`${row.title}: ${row.done ? 'cumplido' : `${row.percent} por ciento`}`}>
          <View style={[styles.check, row.done && styles.checkOn]}>{row.done ? <Check size={16} color={colors.onCobalt} strokeWidth={3} /> : null}</View>
          <View style={styles.grow}>
            <Text variant="bodyStrong" color={row.done ? colors.textMuted : colors.text}>{row.title}</Text>
            {row.done ? null : <Meter percent={row.percent} color={colors.vermilion} />}
          </View>
          <Text variant="label" color={row.done ? colors.cobaltText : colors.textSubtle}>+{row.xp} XP</Text>
        </View>
      ))}
    </Card>
  )
}

export interface BadgeItem {
  badge: Badge
  progress: number
  unlocked: boolean
}

export function BadgeStrip({ items }: { items: BadgeItem[] }) {
  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.badges} style={styles.badgeScroll}>
      {items.map(({ badge, progress, unlocked }) => (
        <View key={badge.id} style={[styles.badge, unlocked && styles.badgeOn]} accessible accessibilityLabel={`${badge.title}: ${unlocked ? 'desbloqueada' : `${Math.round(progress * 100)} por ciento`}. ${badge.description}`}>
          <View style={[styles.medal, unlocked && styles.medalOn]}>
            {unlocked ? <Trophy size={22} color={colors.onCobalt} /> : <Lock size={18} color={colors.textSubtle} />}
          </View>
          <Text variant="small" style={styles.badgeTitle} numberOfLines={2} color={unlocked ? colors.text : colors.textMuted}>{badge.title}</Text>
          {unlocked ? null : <Meter percent={Math.round(progress * 100)} color={colors.cobalt} />}
        </View>
      ))}
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  grow: { flex: 1, gap: 4 },
  streak: { gap: 16 },
  flame: { width: 52, height: 52, borderRadius: radii.md, backgroundColor: colors.signalWash, alignItems: 'center', justifyContent: 'center' },
  streakNum: { fontSize: 38, lineHeight: 40 },
  levelBox: { alignItems: 'flex-end', gap: 2 },
  week: { flexDirection: 'row', justifyContent: 'space-between' },
  day: { alignItems: 'center', gap: 6, flex: 1 },
  dot: { width: 34, height: 34, borderRadius: 17, borderWidth: 1.5, borderColor: colors.lineStrong, alignItems: 'center', justifyContent: 'center' },
  dotOn: { backgroundColor: colors.cobalt, borderColor: colors.cobalt },
  dotToday: { borderColor: colors.vermilion },
  dotFuture: { opacity: 0.4 },
  xp: { gap: 6 },
  goal: { flexDirection: 'row', alignItems: 'center', gap: 18 },
  stepper: { flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 6 },
  stepBtn: { width: 44, height: 44, borderRadius: radii.md, borderWidth: 1, borderColor: colors.lineStrong, alignItems: 'center', justifyContent: 'center' },
  challenges: { gap: 16 },
  challenge: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  check: { width: 28, height: 28, borderRadius: 14, borderWidth: 1.5, borderColor: colors.lineStrong, alignItems: 'center', justifyContent: 'center' },
  checkOn: { backgroundColor: colors.cobalt, borderColor: colors.cobalt },
  badgeScroll: { marginHorizontal: -20 },
  badges: { paddingHorizontal: 20, gap: 12 },
  badge: { width: 108, gap: 8, backgroundColor: colors.surface, borderRadius: radii.lg, borderWidth: 1, borderColor: colors.line, padding: 12 },
  badgeOn: { borderColor: 'rgba(25,227,161,0.45)', backgroundColor: colors.cobaltWash },
  medal: { width: 44, height: 44, borderRadius: 22, backgroundColor: colors.surfaceHigh, alignItems: 'center', justifyContent: 'center' },
  medalOn: { backgroundColor: colors.cobalt },
  badgeTitle: { minHeight: 40 },
})
