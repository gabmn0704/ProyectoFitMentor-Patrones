import type { PosePoint } from '../pose-analysis'
import { FramingGate, START_POSTURE, validateFraming, VoiceCoach } from '../pose-validation'

const blank = (): PosePoint[] => Array.from({ length: 17 }, () => ({ x: 0, y: 0, confidence: 0 }))
const set = (points: PosePoint[], index: number, x: number, y: number, confidence = 0.9) => {
  points[index] = { x, y, confidence }
}

/** Persona de pie, de lado (se ve un lado y la cara), con escala `s` y desplazamiento. */
function standing(s = 1, ox = 0.5, oy = 0.1): PosePoint[] {
  const p = blank()
  const at = (index: number, dx: number, dy: number) => set(p, index, ox + dx * s, oy + dy * s)
  at(0, 0.02, 0)
  at(1, 0.03, -0.01)
  at(2, 0.01, -0.01)
  at(3, 0, 0)
  at(4, -0.01, 0)
  for (const [i, dx] of [[5, -0.03], [6, 0.03]] as const) at(i, dx, 0.12)
  for (const [i, dx] of [[7, -0.03], [8, 0.03]] as const) at(i, dx, 0.25)
  for (const [i, dx] of [[9, -0.03], [10, 0.03]] as const) at(i, dx, 0.37)
  for (const [i, dx] of [[11, -0.03], [12, 0.03]] as const) at(i, dx, 0.36)
  for (const [i, dx] of [[13, -0.03], [14, 0.03]] as const) at(i, dx, 0.58)
  for (const [i, dx] of [[15, -0.03], [16, 0.03]] as const) at(i, dx, 0.8)
  return p
}

/** Sentado: muslos horizontales, tibias verticales. */
function seated(): PosePoint[] {
  const p = standing()
  for (const [h, k, a, dx] of [[11, 13, 15, -0.03], [12, 14, 16, 0.03]] as const) {
    set(p, h, 0.5 + dx, 0.5)
    set(p, k, 0.5 + dx + 0.2, 0.52)
    set(p, a, 0.5 + dx + 0.2, 0.75)
  }
  for (const [i, dx] of [[5, -0.03], [6, 0.03]] as const) set(p, i, 0.5 + dx, 0.25)
  return p
}

describe('validateFraming', () => {
  it('declara la postura inicial de cada ejercicio', () => {
    expect(START_POSTURE).toEqual({ squat: 'standing', lunge: 'standing', deadlift: 'standing', push_up: 'horizontal', plank: 'horizontal' })
  })

  it('acepta una pose de pie correcta', () => {
    expect(validateFraming(standing(), 'squat').kind).toBe('ok')
  })

  it('persona no visible', () => {
    expect(validateFraming(blank(), 'squat').kind).toBe('not_visible')
  })

  it('detecta sentado y lo dice en español', () => {
    const result = validateFraming(seated(), 'squat')
    expect(result.kind).toBe('seated')
    expect(result.message).toBe('Estás sentado: ponte de pie para empezar la sentadilla.')
  })

  it('no confunde el fondo de una sentadilla con sentado una vez iniciada', () => {
    expect(validateFraming(seated(), 'squat', { started: true }).kind).not.toBe('seated')
  })

  it('detecta tumbado cuando el ejercicio es de pie', () => {
    const p = blank()
    for (const [i, x] of [[5, 0.25], [6, 0.25], [11, 0.5], [12, 0.5], [13, 0.65], [14, 0.65], [15, 0.8], [16, 0.8]] as const) set(p, i, x, 0.5)
    for (const i of [0, 1, 2, 3, 4]) set(p, i, 0.2, 0.5)
    expect(validateFraming(p, 'squat').kind).toBe('lying')
  })

  it('detecta demasiado cerca y demasiado lejos', () => {
    expect(validateFraming(standing(1.2, 0.5, -0.1), 'squat').kind).toBe('too_close')
    expect(validateFraming(standing(0.2, 0.5, 0.4), 'squat').kind).toBe('too_far')
  })

  it('detecta piernas fuera de cuadro', () => {
    const p = standing()
    for (const i of [13, 14, 15, 16]) p[i] = { x: 0, y: 0, confidence: 0 }
    expect(validateFraming(p, 'squat').kind).toBe('partial_legs')
  })

  it('detecta baja confianza', () => {
    const p = standing().map((point) => ({ ...point, confidence: point.confidence > 0 ? 0.35 : 0 }))
    expect(validateFraming(p, 'squat').kind).toBe('low_confidence')
  })

  it('detecta de espaldas (sin cara con hombros nítidos)', () => {
    const p = standing()
    for (const i of [0, 1, 2, 3, 4]) p[i] = { x: 0, y: 0, confidence: 0.05 }
    expect(validateFraming(p, 'squat').kind).toBe('facing_away')
  })

  it('pide posición de plancha si el usuario está de pie', () => {
    expect(validateFraming(standing(), 'plank').kind).toBe('not_horizontal')
    expect(validateFraming(standing(), 'push_up').message).toMatch(/flexión/)
  })

  it('acepta plancha horizontal de lado', () => {
    const p = blank()
    for (const [i, x] of [[5, 0.25], [6, 0.26], [11, 0.5], [12, 0.51], [13, 0.65], [14, 0.66], [15, 0.8], [16, 0.81], [7, 0.25], [8, 0.26], [0, 0.18]] as const) set(p, i, x, 0.6 + (i === 5 || i === 6 ? 0 : 0.01))
    expect(validateFraming(p, 'plank').kind).toBe('ok')
  })
})

describe('FramingGate (sin spam)', () => {
  it('no cambia de mensaje por un solo fotograma y no repite changed', () => {
    const gate = new FramingGate()
    gate.push(standing(), 'squat')
    const good = gate.push(standing(), 'squat')
    expect(good.kind).toBe('ok')
    // un fotograma malo suelto no cambia el estado
    expect(gate.push(blank(), 'squat').kind).toBe('ok')
    expect(gate.push(standing(), 'squat').kind).toBe('ok')
  })

  it('emite el cambio una sola vez para el mismo problema persistente', () => {
    const gate = new FramingGate()
    const outputs = Array.from({ length: 30 }, () => gate.push(seated(), 'squat'))
    expect(outputs.filter((output) => output.changed)).toHaveLength(1)
    expect(outputs.at(-1)?.kind).toBe('seated')
  })

  it('tolera posturas de movimiento tras empezar', () => {
    const gate = new FramingGate()
    gate.push(standing(), 'squat')
    gate.push(standing(), 'squat')
    for (let i = 0; i < 5; i++) expect(gate.push(seated(), 'squat').kind).not.toBe('seated')
  })
})

describe('VoiceCoach', () => {
  it('cancela la frase anterior y respeta el enfriamiento por tipo', () => {
    const spoken: string[] = []
    let stops = 0
    const coach = new VoiceCoach((text) => spoken.push(text), () => stops++, { rep: 0 })
    expect(coach.say('seated', 'a', 0)).toBe(true)
    expect(coach.say('seated', 'a', 1000)).toBe(false)
    expect(coach.say('too_far', 'b', 1000)).toBe(true)
    expect(coach.say('rep', '1', 1100)).toBe(true)
    expect(coach.say('rep', '2', 1200)).toBe(true)
    expect(coach.say('seated', 'a', 7000)).toBe(true)
    expect(spoken).toEqual(['a', 'b', '1', '2', 'a'])
    expect(stops).toBe(5)
  })
})

describe('flujo completo sin spam de voz', () => {
  it('60 fotogramas sentado a 15 fps hablan como mucho una vez cada 8 s', () => {
    const spoken: string[] = []
    const coach = new VoiceCoach((text) => spoken.push(text), () => undefined, {}, 8000)
    const gate = new FramingGate()
    for (let frame = 0; frame < 60; frame++) {
      const out = gate.push(seated(), 'squat')
      if (out.confirmed && out.kind !== 'ok') coach.say(out.kind, out.message, frame * 66)
    }
    expect(spoken).toHaveLength(1)
    expect(spoken[0]).toMatch(/Estás sentado/)
  })
})
