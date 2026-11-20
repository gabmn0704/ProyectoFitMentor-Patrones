import {
  badgeStatus,
  challengeProgress,
  clampGoal,
  dailyChallenges,
  levelFromXp,
  quoteOfTheDay,
  streakFromSessions,
  todayChallenges,
  weekDays,
  weeklyGoalProgress,
  weekStart,
} from '../engagement'
import { mascotPhrase } from '../mascot'
import type { SessionRecord } from '../types'

// Miércoles 18 nov 2026, mediodía local.
const NOW = new Date(2026, 10, 18, 12, 0, 0)

function session(daysAgo: number, over: Partial<SessionRecord> = {}): SessionRecord {
  const date = new Date(2026, 10, 18 - daysAgo, 9, 0, 0)
  return { localId: `s${daysAgo}-${Math.random()}`, date: date.toISOString(), synced: true, exercise: 'squat', reps: 10, accuracy: 80, durationSeconds: 60, ...over }
}

describe('streakFromSessions', () => {
  it('es 0 sin sesiones', () => expect(streakFromSessions([], NOW)).toBe(0))
  it('cuenta días seguidos incluyendo hoy', () => {
    expect(streakFromSessions([session(0), session(1), session(2), session(4)], NOW)).toBe(3)
  })
  it('no se rompe si hoy aún no entrenas', () => {
    expect(streakFromSessions([session(1), session(2)], NOW)).toBe(2)
  })
  it('se rompe tras dos días sin entrenar', () => {
    expect(streakFromSessions([session(2), session(3)], NOW)).toBe(0)
  })
})

describe('semana y meta', () => {
  it('la semana empieza en lunes', () => {
    expect(weekStart(NOW).getDay()).toBe(1)
    expect(weekStart(NOW).getDate()).toBe(16)
  })
  it('marca días activos y hoy', () => {
    const days = weekDays([session(0), session(2)], NOW)
    expect(days.map((d) => d.active)).toEqual([true, false, true, false, false, false, false])
    expect(days[2].today).toBe(true)
    expect(days[3].future).toBe(true)
  })
  it('calcula el avance de la meta', () => {
    const p = weeklyGoalProgress([session(0), session(1), session(9)], 4, NOW)
    expect(p).toMatchObject({ done: 2, goal: 4, percent: 50, reached: false })
    expect(weeklyGoalProgress([session(0), session(1)], 2, NOW).reached).toBe(true)
  })
  it('limita la meta a 1..7', () => {
    expect(clampGoal(0)).toBe(1)
    expect(clampGoal(12)).toBe(7)
  })
})

describe('retos', () => {
  it('da tres retos distintos y estables por día', () => {
    const a = dailyChallenges(NOW)
    expect(new Set(a.map((c) => c.id)).size).toBe(3)
    expect(dailyChallenges(NOW)).toEqual(a)
  })
  it('mide el avance por métrica', () => {
    const today = [session(0, { reps: 20, accuracy: 85 })]
    const reps = { id: 'r', title: '', metric: 'reps' as const, target: 15, xp: 1 }
    expect(challengeProgress(reps, today)).toMatchObject({ done: true, percent: 100 })
    const acc = { id: 'a', title: '', metric: 'accuracy' as const, target: 90, xp: 1 }
    expect(challengeProgress(acc, today).done).toBe(false)
  })
  it('todayChallenges devuelve tres con avance', () => {
    expect(todayChallenges([], NOW)).toHaveLength(3)
  })
})

describe('nivel y medallas', () => {
  it('sube de nivel con la XP', () => {
    expect(levelFromXp(0).level).toBe(1)
    expect(levelFromXp(100).level).toBe(2)
    expect(levelFromXp(400).level).toBe(3)
  })
  it('desbloquea medallas según el contexto', () => {
    const status = badgeStatus({ sessions: [session(0)], streakDays: 3, challengesDone: 0 })
    const byId = Object.fromEntries(status.map((s) => [s.badge.id, s.unlocked]))
    expect(byId['first-rep']).toBe(true)
    expect(byId['streak-3']).toBe(true)
    expect(byId['streak-7']).toBe(false)
  })
})

describe('frases', () => {
  it('la frase del día es estable', () => {
    expect(quoteOfTheDay(NOW, 'u1')).toBe(quoteOfTheDay(NOW, 'u1'))
    expect(quoteOfTheDay(NOW).length).toBeGreaterThan(10)
  })
  it('mascotPhrase con semilla es determinista', () => {
    expect(mascotPhrase('wave', 2)).toBe(mascotPhrase('wave', 2))
  })
})
