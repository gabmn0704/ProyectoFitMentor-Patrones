import { router } from 'expo-router'
import { Camera, ChevronDown, ChevronUp, Droplets, Moon, Timer } from 'lucide-react-native'
import { useMemo, useState } from 'react'
import { ScrollView, StyleSheet, View } from 'react-native'
import { catalogLabel } from '../../lib/catalog'
import { goalName, currentWeek } from '../../lib/profile'
import { mealPlanForDay } from '../../lib/meals'
import { postWorkoutTip } from '../../lib/nutrition'
import { buildWeekPlan, DAY_SHORT, todayIndex, type PlanItem } from '../../lib/weeklyPlan'
import { useAuth } from '../../state/auth'
import { useData } from '../../state/data'
import { colors, fonts, radii } from '../../theme'
import { Button } from '../../ui/Button'
import { BibTile, Card } from '../../ui/Card'
import { Meter } from '../../ui/Charts'
import { Segmented } from '../../ui/Controls'
import { PageHero } from '../../ui/PageHero'
import { haptic } from '../../ui/haptics'
import { Mascot } from '../../ui/Mascot'
import { Pressable } from '../../ui/Pressable'
import { Reveal, Screen, SectionTitle } from '../../ui/Screen'
import { EmptyState, Notice } from '../../ui/States'
import { Text } from '../../ui/Text'

type Tab = 'routine' | 'food'

export default function Plan() {
  const { user } = useAuth()
  const { body } = useData()
  const [tab, setTab] = useState<Tab>('routine')
  const [selected, setSelected] = useState(todayIndex())
  const [open, setOpen] = useState<string | null>(null)

  const week = body ? currentWeek(body) : 1
  const plan = useMemo(() => (body && user ? buildWeekPlan(body, user.level, week) : null), [body, user, week])
  const day = plan?.days[selected]
  const meals = useMemo(() => (body && day ? mealPlanForDay(body, day.kind === 'train', day.index + week) : null), [body, day, week])

  if (!body || !plan || !day) {
    return (
      <Screen title="Tu plan" eyebrow="Plan">
        <PageHero photo="core" state="worried" message="Aún no tengo tus datos para armar el plan." />
        <EmptyState icon={<Moon size={26} color={colors.textMuted} />} title="Aún no hay plan" hint="Completa tu perfil para calcular tu rutina y tu alimentación." action={{ label: 'Crear mi plan', onPress: () => router.push('/edit-body') }} />
      </Screen>
    )
  }

  const train = (item: PlanItem) => item.engine && router.navigate({ pathname: '/train', params: { exercise: item.engine } })

  return (
    <Screen title="Tu plan" eyebrow={`Semana ${week} · ${goalName(body.goal)}`}>
      <Reveal index={0} style={styles.gap}>
        <PageHero photo="core"
          state={day.kind === 'rest' ? 'rest' : plan.deload ? 'idle' : 'wave'}
          message={day.kind === 'rest' ? 'Hoy toca recuperar. Tu cuerpo mejora mientras descansa.' : plan.deload ? 'Semana de descarga: baja la carga y cuida la técnica.' : 'Este es tu plan. Un día a la vez.'}
        >
          <View style={styles.theme}>
            <Text variant="label" color={colors.cobaltText}>{plan.deload ? 'Semana de descarga' : 'Esta semana'}</Text>
            <Text variant="title">{plan.theme}</Text>
          </View>
        </PageHero>
        <Segmented options={[{ value: 'routine', label: 'Rutina' }, { value: 'food', label: 'Alimentación' }]} value={tab} onChange={setTab} />
      </Reveal>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.days} style={styles.daysWrap}>
        {plan.days.map((item) => {
          const active = item.index === selected
          const isToday = item.index === todayIndex()
          return (
            <Pressable
              key={item.index}
              onPress={() => { haptic.tap(); setSelected(item.index) }}
              accessibilityLabel={`${item.name}${isToday ? ', hoy' : ''}, ${item.kind === 'train' ? item.title : 'descanso'}`}
              accessibilityState={{ selected: active }}
              style={[styles.day, active && styles.dayOn, !active && isToday && styles.dayToday]}
            >
              <Text variant="label" color={active ? colors.onCobalt : colors.textMuted}>{DAY_SHORT[item.index]}</Text>
              {isToday ? <Text variant="small" color={active ? colors.onCobalt : colors.vermilion} style={styles.todayTag}>hoy</Text> : null}
              <View style={[styles.dayMark, { backgroundColor: item.kind === 'train' ? (active ? colors.onCobalt : colors.cobaltText) : colors.lineStrong }]} />
            </Pressable>
          )
        })}
      </ScrollView>

      {tab === 'routine' ? (
        <View style={styles.gap}>
          <SectionTitle trailing={day.kind === 'train' ? <View style={styles.time}><Timer size={14} color={colors.textMuted} /><Text variant="small" color={colors.textMuted}>{day.minutes} min</Text></View> : undefined}>{day.title}</SectionTitle>
          <Text color={colors.textMuted}>{day.focus}</Text>
          {day.kind === 'rest' ? (
            <Card tone="signal" style={styles.restCard}>
              <Mascot state="rest" size={96} message="Camina 20 a 30 minutos o haz movilidad." placement="right" />
              <Text variant="small" color={colors.textMuted}>Descansar también es parte del plan.</Text>
            </Card>
          ) : (
            day.items.map((item, index) => (
              <Reveal key={item.exercise} index={index}>
                <Card style={styles.item}>
                  <View style={styles.itemTop}>
                    <View style={styles.index}><Text variant="bodyStrong" color={colors.cobaltText} style={{ fontFamily: fonts.display }}>{index + 1}</Text></View>
                    <View style={styles.flex}>
                      <Text variant="bodyStrong">{catalogLabel(item.exercise)}</Text>
                      <Text variant="small" color={colors.textMuted}>
                        {item.sets} series × {item.target} {item.unit === 'seconds' ? 's' : 'reps'}{item.perSide ? ' por lado' : ''} · descanso {item.restSec} s
                      </Text>
                    </View>
                  </View>
                  <Text variant="small" color={colors.textSubtle}>{item.note}</Text>
                  {item.engine ? (
                    <Button label="Medir con la cámara" variant="ghost" onPress={() => train(item)} icon={<Camera size={16} color={colors.text} />} />
                  ) : (
                    <Text variant="small" color={colors.textSubtle}>Se hace con la guía: marca tus series al terminar.</Text>
                  )}
                </Card>
              </Reveal>
            ))
          )}
        </View>
      ) : meals ? (
        <View style={styles.gap}>
          <View style={styles.tiles}>
            <BibTile label="Calorías" value={meals.targets.kcal} suffix="kcal" band="cobalt" />
            <BibTile label="Proteína" value={meals.targets.proteinG} suffix="g" band="ink" />
          </View>
          <View style={styles.tiles}>
            <BibTile label="Carbos" value={meals.targets.carbsG} suffix="g" band="ink" />
            <BibTile label="Grasas" value={meals.targets.fatG} suffix="g" band="cobalt" />
          </View>
          <Card style={styles.water}>
            <Droplets size={20} color={colors.cobaltText} />
            <Text variant="bodyStrong">{meals.targets.waterL} litros de agua hoy</Text>
          </Card>
          {meals.targets.notes.map((note) => <Notice key={note}>{note}</Notice>)}
          {meals.meals.map((meal) => {
            const expanded = open === meal.slot
            return (
              <Card key={meal.slot} style={styles.meal}>
                <Pressable onPress={() => setOpen(expanded ? null : meal.slot)} accessibilityState={{ expanded }} accessibilityLabel={`${meal.title}, ${meal.kcal} kilocalorías`} style={styles.mealHead}>
                  <View style={styles.flex}>
                    <Text variant="label" color={colors.cobaltText}>{meal.title}</Text>
                    <Text variant="bodyStrong">{meal.dish}</Text>
                    <Text variant="small" color={colors.textMuted}>{meal.kcal} kcal · P {meal.proteinG} · C {meal.carbsG} · G {meal.fatG}</Text>
                  </View>
                  {expanded ? <ChevronUp size={20} color={colors.textMuted} /> : <ChevronDown size={20} color={colors.textMuted} />}
                </Pressable>
                <Meter percent={(meal.kcal / Math.max(1, meals.total.kcal)) * 100} />
                {expanded ? (
                  <View style={styles.gap}>
                    {meal.items.map((item) => (
                      <View key={item.name + item.grams} style={styles.food}>
                        <Text variant="small">{item.amount} {item.label}</Text>
                        {item.swaps.length ? <Text variant="small" color={colors.textSubtle}>Equivale a: {item.swaps.join(' · ')}</Text> : null}
                      </View>
                    ))}
                  </View>
                ) : null}
              </Card>
            )
          })}
          {day.kind === 'train' ? <Notice>{postWorkoutTip(body.goal)}</Notice> : null}
        </View>
      ) : null}
    </Screen>
  )
}

const styles = StyleSheet.create({
  gap: { gap: 12 },
  flex: { flex: 1 },
  theme: { gap: 4 },
  restCard: { gap: 10, padding: 14 },
  daysWrap: { flexGrow: 0, marginHorizontal: -20 },
  days: { paddingHorizontal: 20, gap: 8 },
  day: { width: 54, height: 72, borderRadius: radii.md, borderWidth: 1, borderColor: colors.line, backgroundColor: colors.surface, alignItems: 'center', justifyContent: 'center', gap: 8 },
  dayOn: { backgroundColor: colors.cobalt, borderColor: colors.cobalt },
  dayToday: { borderColor: colors.vermilion },
  todayTag: { fontSize: 10, lineHeight: 12, marginTop: -4 },
  dayMark: { width: 8, height: 8, borderRadius: 2 },
  time: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  item: { gap: 10, padding: 16 },
  itemTop: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  index: { width: 36, height: 36, borderRadius: radii.sm, backgroundColor: colors.cobaltWash, alignItems: 'center', justifyContent: 'center' },
  tiles: { flexDirection: 'row', gap: 12 },
  water: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 14 },
  meal: { gap: 12, padding: 16 },
  mealHead: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  food: { gap: 2, paddingVertical: 6, borderTopWidth: 1, borderTopColor: colors.line },
})
