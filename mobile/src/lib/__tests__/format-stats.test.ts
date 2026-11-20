import { errorMessageFor, parseRetryAfter } from '../api'
import { firstName, formatDuration, formatShortDate, greeting, initials, weekdayLabel } from '../format'
import { computeLocalStats, weeklyProgress } from '../stats'
import type { SessionRecord } from '../types'

describe('formato', () => {
  it('formatea duraciones', () => {
    expect(formatDuration(65)).toBe('1:05')
    expect(formatDuration(3725)).toBe('1:02:05')
    expect(formatDuration(-4)).toBe('0:00')
  })

  it('formatea fechas cortas en español', () => {
    expect(formatShortDate('2026-10-21T12:00:00')).toBe('21 oct')
    expect(formatShortDate('basura')).toBe('')
  })

  it('calcula iniciales, nombre y día de la semana', () => {
    expect(initials('Ana María López')).toBe('AM')
    expect(initials('  ')).toBe('FM')
    expect(firstName('Ana María')).toBe('Ana')
    expect(weekdayLabel('2026-03-02')).toBe('lun')
  })

  it('saluda según la hora', () => {
    expect(greeting(new Date(2026, 0, 1, 8))).toBe('Buenos días')
    expect(greeting(new Date(2026, 0, 1, 15))).toBe('Buenas tardes')
    expect(greeting(new Date(2026, 0, 1, 22))).toBe('Buenas noches')
  })
})

describe('errores de API', () => {
  it('traduce códigos y estados', () => {
    expect(errorMessageFor(401, '', { authenticated: true })).toMatch(/caducó/)
    expect(errorMessageFor(401, '', { authenticated: false })).toMatch(/incorrectos/)
    expect(errorMessageFor(429, '', { retryAfter: 30 })).toMatch(/30 s/)
    expect(errorMessageFor(500)).toMatch(/servidor/)
    expect(errorMessageFor(400, JSON.stringify({ error: 'VALIDATION_ERROR' }))).toMatch(/no son válidos/)
  })

  it('interpreta Retry-After', () => {
    expect(parseRetryAfter('12')).toBe(12)
    expect(parseRetryAfter(null)).toBeNull()
    expect(parseRetryAfter('nope')).toBeNull()
  })
})

describe('estadísticas locales', () => {
  const now = new Date('2026-03-10T12:00:00')
  const session = (daysAgo: number, reps: number, accuracy: number): SessionRecord => ({
    exercise: 'squat',
    reps,
    accuracy,
    durationSeconds: 60,
    localId: `${daysAgo}-${reps}`,
    date: new Date(now.getTime() - daysAgo * 86_400_000).toISOString(),
    synced: false,
  })

  it('calcula totales, racha y semana', () => {
    const stats = computeLocalStats([session(0, 10, 80), session(1, 12, 90), session(3, 5, 70)], now)
    expect(stats.totalSessions).toBe(3)
    expect(stats.totalReps).toBe(27)
    expect(stats.avgAccuracy).toBe(80)
    expect(stats.streakDays).toBe(2)
    expect(stats.weekly).toHaveLength(7)
    expect(weeklyProgress(stats).reps).toBe(27)
  })

  it('sin sesiones todo es cero', () => {
    const stats = computeLocalStats([], now)
    expect(stats.totalSessions).toBe(0)
    expect(stats.streakDays).toBe(0)
    expect(weeklyProgress(stats).percent).toBe(0)
  })
})
