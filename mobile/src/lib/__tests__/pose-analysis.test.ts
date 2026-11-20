import { advanceRepPhase, analyzePose, type PosePoint, type RepPhase } from '../pose-analysis'

const empty = (): PosePoint[] => Array.from({ length: 17 }, () => ({ x: 0, y: 0, confidence: 0 }))

/** Pierna con la rodilla flexionada `degrees` grados (cadera 11/12, rodilla 13/14, tobillo 15/16). */
function legPose(degrees: number): PosePoint[] {
  const points = empty()
  const rad = (degrees * Math.PI) / 180
  for (const [hip, knee, ankle, x] of [[11, 13, 15, 0.4], [12, 14, 16, 0.6]] as const) {
    points[hip] = { x, y: 0.4, confidence: 0.9 }
    points[knee] = { x, y: 0.6, confidence: 0.9 }
    points[ankle] = { x: x + Math.sin(rad) * 0.2, y: 0.6 - Math.cos(rad) * 0.2, confidence: 0.9 }
  }
  return points
}

describe('analyzePose', () => {
  it('devuelve null sin puntos fiables', () => {
    expect(analyzePose(empty(), 'squat')).toBeNull()
    expect(analyzePose(empty(), 'plank')).toBeNull()
  })

  it('mide el ángulo de rodilla y puntúa la sentadilla', () => {
    const standing = analyzePose(legPose(175), 'squat')
    const deep = analyzePose(legPose(95), 'squat')
    expect(standing?.kneeAngle).toBeGreaterThan(165)
    expect(deep?.kneeAngle).toBeGreaterThan(85)
    expect(deep?.kneeAngle).toBeLessThan(105)
    expect(deep!.score).toBeGreaterThan(90)
    expect(deep!.feedback).toMatch(/Rodillas flexionadas/)
  })

  it('trata la zancada con la misma lógica de rodilla', () => {
    expect(analyzePose(legPose(95), 'lunge')?.score).toBe(analyzePose(legPose(95), 'squat')?.score)
  })

  it('mantiene la puntuación entre 0 y 100', () => {
    for (const degrees of [20, 60, 100, 140, 179]) {
      const result = analyzePose(legPose(degrees), 'squat')!
      expect(result.score).toBeGreaterThanOrEqual(0)
      expect(result.score).toBeLessThanOrEqual(100)
    }
  })
})

describe('advanceRepPhase', () => {
  it('cuenta una repetición de sentadilla completa', () => {
    let phase: RepPhase = 'ready'
    let reps = 0
    for (const angle of [170, 160, 130, 110, 90, 100, 150, 170]) {
      const next = advanceRepPhase('squat', phase, angle)
      phase = next.phase
      if (next.completed) reps += 1
    }
    expect(reps).toBe(1)
    expect(phase).toBe('up')
  })

  it('no cuenta si no se llega a la profundidad', () => {
    let phase: RepPhase = 'ready'
    let reps = 0
    for (const angle of [170, 130, 120, 160, 170]) {
      const next = advanceRepPhase('push_up', phase, angle)
      phase = next.phase
      if (next.completed) reps += 1
    }
    expect(reps).toBe(0)
  })

  it('la plancha no cuenta repeticiones', () => {
    expect(advanceRepPhase('plank', 'ready', 170)).toEqual({ phase: 'ready', completed: false })
  })
})
