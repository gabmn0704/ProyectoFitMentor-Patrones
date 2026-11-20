jest.mock('../storage', () => ({ kv: {}, tokenStore: {} }))

import { mealPlanForDay } from '../meals'
import { nutritionTargets } from '../nutrition'
import { currentWeek, validateProfile, type BodyProfile } from '../profile'
import { buildWeekPlan, todayIndex } from '../weeklyPlan'

const profile: BodyProfile = {
  goal: 'lose_fat',
  weightKg: 82,
  heightCm: 175,
  age: 30,
  sex: 'male',
  targetWeightKg: 74,
  weeks: 16,
  daysPerWeek: 4,
  diet: 'omnivore',
  startedAt: '2026-03-02T08:00:00.000Z',
}

describe('plan semanal', () => {
  it('reparte los días de entrenamiento pedidos', () => {
    const week = buildWeekPlan(profile, 'INTERMEDIATE', 1)
    expect(week.days).toHaveLength(7)
    expect(week.days.filter((day) => day.kind === 'train')).toHaveLength(4)
    expect(week.days.filter((day) => day.kind === 'rest').every((day) => day.items.length === 0)).toBe(true)
  })

  it('la cuarta semana es de descarga con menos series', () => {
    const normal = buildWeekPlan(profile, 'INTERMEDIATE', 1)
    const deload = buildWeekPlan(profile, 'INTERMEDIATE', 4)
    expect(deload.deload).toBe(true)
    const sets = (plan: typeof normal) => plan.days.flatMap((day) => day.items).reduce((sum, item) => sum + item.sets, 0)
    expect(sets(deload)).toBeLessThan(sets(normal))
  })

  it('calcula la semana actual y el índice de hoy', () => {
    expect(currentWeek(profile, new Date('2026-03-02T09:00:00.000Z'))).toBe(1)
    expect(currentWeek(profile, new Date('2026-03-17T09:00:00.000Z'))).toBe(3)
    expect(todayIndex(new Date(2026, 2, 2))).toBe(0)
    expect(todayIndex(new Date(2026, 2, 8))).toBe(6)
  })
})

describe('nutrición', () => {
  it('bajar de peso resta calorías y respeta el mínimo seguro', () => {
    const targets = nutritionTargets(profile)
    expect(targets.kcal).toBeLessThan(targets.tdee)
    expect(targets.kcal).toBeGreaterThanOrEqual(1500)
    expect(targets.weeklyChangeKg).toBeLessThan(0)
  })

  it('arma comidas cercanas a la meta calórica del día', () => {
    const day = mealPlanForDay(profile, true, 3)
    expect(day.meals.length).toBe(5)
    expect(Math.abs(day.total.kcal - day.targets.kcal) / day.targets.kcal).toBeLessThan(0.15)
    expect(mealPlanForDay(profile, false, 3).meals.length).toBe(4)
  })

  it('respeta la dieta vegetariana', () => {
    const day = mealPlanForDay({ ...profile, diet: 'vegetarian' }, true, 2)
    const names = day.meals.flatMap((meal) => meal.items.map((item) => item.name.toLowerCase())).join(' ')
    expect(names).not.toMatch(/pollo|res|cerdo|pescado|atún|atun/)
  })
})

describe('validación del perfil', () => {
  it('acepta un perfil correcto', () => {
    expect(validateProfile(profile)).toEqual({})
  })

  it('rechaza peso fuera de rango y meta incoherente', () => {
    const errors = validateProfile({ ...profile, weightKg: 10, targetWeightKg: 90 })
    expect(errors.weightKg).toBeDefined()
    expect(errors.targetWeightKg).toBeDefined()
  })
})
