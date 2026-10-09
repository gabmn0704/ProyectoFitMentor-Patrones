export type Exercise = 'squat' | 'push_up' | 'plank' | 'deadlift'
export type PosePoint = { x: number; y: number; confidence: number }
export type RepPhase = 'ready' | 'up' | 'descending' | 'bottom'
export type PoseAnalysis = {
  score: number
  movementAngle: number | null
  kneeAngle: number | null
  alignment: number | null
  feedback: string
}

const minimumConfidence = 0.28

function angle(first: PosePoint, vertex: PosePoint, last: PosePoint): number {
  const firstX = first.x - vertex.x
  const firstY = first.y - vertex.y
  const lastX = last.x - vertex.x
  const lastY = last.y - vertex.y
  const denominator = Math.hypot(firstX, firstY) * Math.hypot(lastX, lastY)
  if (denominator === 0) return 0
  const cosine = Math.max(-1, Math.min(1, (firstX * lastX + firstY * lastY) / denominator))
  return Math.acos(cosine) * (180 / Math.PI)
}

function point(points: PosePoint[], index: number): PosePoint | null {
  const value = points[index]
  return value && value.confidence >= minimumConfidence ? value : null
}

function averageAngle(points: PosePoint[], triples: Array<[number, number, number]>): number | null {
  const values = triples.flatMap(([first, vertex, last]) => {
    const a = point(points, first)
    const b = point(points, vertex)
    const c = point(points, last)
    return a && b && c ? [angle(a, b, c)] : []
  })
  return values.length ? values.reduce((sum, value) => sum + value, 0) / values.length : null
}

function bodyAlignment(points: PosePoint[]): number | null {
  const shoulders = [point(points, 5), point(points, 6)]
  const hips = [point(points, 11), point(points, 12)]
  const ankles = [point(points, 15), point(points, 16)]
  if (shoulders.some(value => !value) || hips.some(value => !value) || ankles.some(value => !value)) return null

  const midpoint = (pair: PosePoint[]) => ({
    x: (pair[0]!.x + pair[1]!.x) / 2,
    y: (pair[0]!.y + pair[1]!.y) / 2,
  })
  const shoulder = midpoint(shoulders as PosePoint[])
  const hip = midpoint(hips as PosePoint[])
  const ankle = midpoint(ankles as PosePoint[])
  const lineX = ankle.x - shoulder.x
  const lineY = ankle.y - shoulder.y
  const length = Math.hypot(lineX, lineY)
  if (length < 0.08) return null
  return Math.abs(lineX * (shoulder.y - hip.y) - (shoulder.x - hip.x) * lineY) / length
}

export function analyzePose(points: PosePoint[], exercise: Exercise): PoseAnalysis | null {
  const kneeAngle = averageAngle(points, [[11, 13, 15], [12, 14, 16]])
  const elbowAngle = averageAngle(points, [[5, 7, 9], [6, 8, 10]])
  const hipAngle = averageAngle(points, [[5, 11, 13], [6, 12, 14]])
  const alignment = bodyAlignment(points)
  const movementAngle = exercise === 'push_up' ? elbowAngle : exercise === 'deadlift' ? hipAngle : kneeAngle
  if (exercise === 'plank' ? alignment === null : movementAngle === null) return null

  let score = 82
  if (exercise === 'squat' && kneeAngle !== null) {
    score = kneeAngle > 145 ? 92 : kneeAngle < 55 ? 58 : Math.max(65, 98 - Math.abs(kneeAngle - 95) * 0.35)
  } else if (exercise === 'push_up' && elbowAngle !== null) {
    score = Math.max(45, 96 - (alignment ?? 0.2) * 180 - Math.max(0, 65 - elbowAngle) * 0.3)
  } else if (exercise === 'plank' && alignment !== null) {
    score = Math.max(35, 100 - alignment * 360)
  } else if (exercise === 'deadlift' && hipAngle !== null) {
    score = hipAngle < 65 ? 58 : hipAngle > 177 ? 78 : Math.max(65, 96 - Math.max(0, 85 - hipAngle) * 0.7)
  }

  let feedback = 'Buen control. Mantén el movimiento fluido.'
  if (exercise === 'squat' && kneeAngle !== null) {
    feedback = kneeAngle > 145 ? 'Inicia el descenso llevando la cadera atrás.' : kneeAngle < 55 ? 'Reduce la profundidad y conserva el control.' : 'Rodillas flexionadas. Empuja el suelo para subir.'
  } else if (exercise === 'push_up') {
    feedback = (alignment ?? 0) > 0.13 ? 'Alinea hombros, cadera y tobillos.' : (elbowAngle ?? 180) < 75 ? 'Empuja el suelo y extiende los brazos.' : 'Cuerpo firme. Desciende con control.'
  } else if (exercise === 'plank') {
    feedback = (alignment ?? 0) > 0.12 ? 'Ajusta la cadera para alinear el cuerpo.' : 'Buena línea corporal. Respira con calma.'
  } else if (exercise === 'deadlift') {
    feedback = (hipAngle ?? 180) < 75 ? 'Reduce la inclinación y mantén la espalda firme.' : (hipAngle ?? 0) > 155 ? 'Lleva la cadera atrás para iniciar la bisagra.' : 'Mantén la espalda firme y vuelve extendiendo la cadera.'
  }

  return {
    score: Math.round(Math.max(0, Math.min(100, score))),
    movementAngle: movementAngle === null ? null : Math.round(movementAngle),
    kneeAngle: kneeAngle === null ? null : Math.round(kneeAngle),
    alignment,
    feedback,
  }
}

export function advanceRepPhase(exercise: Exercise, phase: RepPhase, value: number): { phase: RepPhase; completed: boolean } {
  if (exercise === 'plank') return { phase, completed: false }
  if (exercise === 'squat') {
    if (phase === 'ready' && value > 150) return { phase: 'up', completed: false }
    if (phase === 'up' && value < 125) return { phase: 'descending', completed: false }
    if (phase === 'descending' && value < 100) return { phase: 'bottom', completed: false }
    if (phase === 'bottom' && value > 145) return { phase: 'up', completed: true }
  } else if (exercise === 'push_up') {
    if (phase === 'ready' && value > 150) return { phase: 'up', completed: false }
    if (phase === 'up' && value < 120) return { phase: 'descending', completed: false }
    if (phase === 'descending' && value < 90) return { phase: 'bottom', completed: false }
    if (phase === 'bottom' && value > 145) return { phase: 'up', completed: true }
  } else {
    if (phase === 'ready' && value > 155) return { phase: 'up', completed: false }
    if (phase === 'up' && value < 135) return { phase: 'descending', completed: false }
    if (phase === 'descending' && value < 105) return { phase: 'bottom', completed: false }
    if (phase === 'bottom' && value > 155) return { phase: 'up', completed: true }
  }
  return { phase, completed: false }
}
