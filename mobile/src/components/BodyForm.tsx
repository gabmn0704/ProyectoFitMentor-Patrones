import { useState } from 'react'
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { goalUsesTargetWeight, GOAL_OPTIONS, validateProfile, type BodyProfile, type FitnessGoal, type ProfileErrors } from '../lib/profile'
import { colors, radii } from '../theme'
import { Button } from '../ui/Button'
import { Chip, Field, Segmented } from '../ui/Controls'
import { haptic } from '../ui/haptics'
import { Mascot } from '../ui/Mascot'
import { Text } from '../ui/Text'

type Props = {
  initial?: BodyProfile | null
  title: string
  lead: string
  submitLabel: string
  onSubmit: (profile: BodyProfile) => Promise<void> | void
  onCancel?: () => void
}

const num = (text: string): number => Number(text.replace(',', '.').trim())
const orNull = (text: string): number | null => (text.trim() === '' ? null : num(text))

/** Formulario del perfil físico: alimenta la rutina semanal, la alimentación y al coach. */
export function BodyForm({ initial, title, lead, submitLabel, onSubmit, onCancel }: Props) {
  const insets = useSafeAreaInsets()
  const [goal, setGoal] = useState<FitnessGoal>(initial?.goal ?? 'health')
  const [weight, setWeight] = useState(initial ? String(initial.weightKg) : '')
  const [height, setHeight] = useState(initial ? String(initial.heightCm) : '')
  const [age, setAge] = useState(initial?.age ? String(initial.age) : '')
  const [sex, setSex] = useState<'female' | 'male' | 'none'>(initial?.sex ?? 'none')
  const [target, setTarget] = useState(initial?.targetWeightKg ? String(initial.targetWeightKg) : '')
  const [weeks, setWeeks] = useState(initial ? String(initial.weeks) : '12')
  const [days, setDays] = useState<'3' | '4' | '5' | '6'>(initial ? (String(initial.daysPerWeek) as '3' | '4' | '5' | '6') : '4')
  const [diet, setDiet] = useState<'omnivore' | 'vegetarian'>(initial?.diet ?? 'omnivore')
  const [errors, setErrors] = useState<ProfileErrors>({})
  const [saving, setSaving] = useState(false)

  const usesTarget = goalUsesTargetWeight(goal)

  const submit = async () => {
    const draft: BodyProfile = {
      goal,
      weightKg: num(weight),
      heightCm: num(height),
      age: orNull(age),
      sex: sex === 'none' ? null : sex,
      targetWeightKg: usesTarget ? orNull(target) : null,
      weeks: num(weeks),
      daysPerWeek: Number(days) as BodyProfile['daysPerWeek'],
      diet,
      avoid: initial?.avoid,
      startedAt: initial?.startedAt ?? new Date().toISOString(),
    }
    const found = validateProfile(draft)
    setErrors(found)
    if (Object.keys(found).length) return haptic.warn()
    setSaving(true)
    try {
      await onSubmit(draft)
      haptic.success()
    } finally {
      setSaving(false)
    }
  }

  return (
    <KeyboardAvoidingView style={styles.root} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={[styles.content, { paddingTop: insets.top + 24, paddingBottom: insets.bottom + 32 }]} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
        <View style={styles.head}>
          <Text variant="headline" accessibilityRole="header">{title}</Text>
          <Text color={colors.textMuted}>{lead}</Text>
          <Mascot state="wave" size={84} message="Con tus datos armo un plan a tu medida." placement="right" style={{ alignSelf: 'stretch', marginTop: 4 }} />
        </View>

        <View style={styles.group}>
          <Text variant="label" color={colors.cobaltText}>Tu objetivo</Text>
          <View style={styles.wrap}>
            {GOAL_OPTIONS.map((option) => (
              <Chip key={option.value} label={option.label} selected={goal === option.value} onPress={() => setGoal(option.value)} />
            ))}
          </View>
          <Text variant="small" color={colors.textSubtle}>{GOAL_OPTIONS.find((option) => option.value === goal)?.hint}</Text>
        </View>

        <View style={styles.row}>
          <View style={styles.flex}><Field label="Peso (kg)" value={weight} onChangeText={setWeight} keyboardType="decimal-pad" error={errors.weightKg} /></View>
          <View style={styles.flex}><Field label="Altura (cm)" value={height} onChangeText={setHeight} keyboardType="decimal-pad" error={errors.heightCm} /></View>
        </View>
        <View style={styles.row}>
          <View style={styles.flex}><Field label="Edad (opcional)" value={age} onChangeText={setAge} keyboardType="number-pad" error={errors.age} /></View>
          <View style={styles.flex}><Field label="Plazo (semanas)" value={weeks} onChangeText={setWeeks} keyboardType="number-pad" error={errors.weeks} /></View>
        </View>
        {usesTarget ? <Field label="Peso meta (kg)" value={target} onChangeText={setTarget} keyboardType="decimal-pad" error={errors.targetWeightKg} /> : null}

        <View style={styles.group}>
          <Text variant="label" color={colors.cobaltText}>Sexo (para calcular calorías)</Text>
          <Segmented
            options={[
              { value: 'female', label: 'Mujer' },
              { value: 'male', label: 'Hombre' },
              { value: 'none', label: 'Prefiero no decir' },
            ]}
            value={sex}
            onChange={setSex}
          />
        </View>
        <View style={styles.group}>
          <Text variant="label" color={colors.cobaltText}>Días por semana</Text>
          <Segmented options={['3', '4', '5', '6'].map((value) => ({ value: value as '3', label: value }))} value={days} onChange={setDays} />
        </View>
        <View style={styles.group}>
          <Text variant="label" color={colors.cobaltText}>Alimentación</Text>
          <Segmented
            options={[
              { value: 'omnivore', label: 'Como de todo' },
              { value: 'vegetarian', label: 'Vegetariana' },
            ]}
            value={diet}
            onChange={setDiet}
          />
        </View>

        <Text variant="small" color={colors.textSubtle} style={styles.note}>
          Estos datos se guardan solo en este teléfono. Las cuentas son orientación general, no consejo médico.
        </Text>
        <Button label={submitLabel} onPress={() => void submit()} loading={saving} large />
        {onCancel ? <Button label="Cancelar" variant="ghost" onPress={onCancel} /> : null}
      </ScrollView>
    </KeyboardAvoidingView>
  )
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  content: { paddingHorizontal: 20, gap: 20 },
  head: { gap: 8 },
  group: { gap: 10 },
  wrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  row: { flexDirection: 'row', gap: 12 },
  flex: { flex: 1 },
  note: { borderRadius: radii.sm },
})
