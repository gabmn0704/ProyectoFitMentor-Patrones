import { localCoachAnswer, normalizeText } from '../coachLocal'

describe('localCoachAnswer', () => {
  it('normaliza tildes y mayúsculas', () => {
    expect(normalizeText('  ¿Qué Rutina?  ')).toBe('¿que rutina?')
  })
  it('responde con aviso de salud ante dolor', () => {
    expect(localCoachAnswer('Me duele la rodilla')).toMatch(/profesional de la salud/)
  })
  it('responde por intención', () => {
    expect(localCoachAnswer('Dame una rutina de 15 min')).toMatch(/Rutina corta/)
    expect(localCoachAnswer('Hola')).toMatch(/coach de técnica/)
  })
  it('usa un texto de respaldo cuando no entiende', () => {
    expect(localCoachAnswer('xyzzy')).toMatch(/no logro conectar/)
  })
  it('abre con las metas del plan en preguntas de alimentación', () => {
    const profile = { kcal: 2200, proteinG: 150 } as never
    expect(localCoachAnswer('cuanta proteina debo comer', profile)).toMatch(/2200 kcal y unos 150 g/)
  })
})
