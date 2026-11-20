import type { Exercise, PosePoint } from './pose-analysis'

/** Postura con la que debe empezar cada ejercicio. */
export type StartPosture = 'standing' | 'horizontal'

export const START_POSTURE: Record<Exercise, StartPosture> = {
  squat: 'standing',
  lunge: 'standing',
  deadlift: 'standing',
  push_up: 'horizontal',
  plank: 'horizontal',
}

export type FramingKind =
  | 'ok'
  | 'not_visible'
  | 'partial_legs'
  | 'partial_body'
  | 'too_close'
  | 'too_far'
  | 'low_confidence'
  | 'seated'
  | 'lying'
  | 'not_horizontal'
  | 'front_facing'
  | 'facing_away'

export type FramingResult = { kind: FramingKind; message: string }

export const FRAMING_MESSAGES: Record<Exclude<FramingKind, 'ok'>, (exercise: Exercise) => string> = {
  not_visible: () => 'No te veo. Colócate frente a la cámara con el cuerpo completo en el encuadre.',
  partial_legs: () => 'No se ven tus piernas. Aléjate o baja el teléfono para que entre el cuerpo completo.',
  partial_body: () => 'Tu cuerpo sale cortado. Ajusta el teléfono para que se vean hombros, cadera y pies.',
  too_close: () => 'Estás demasiado cerca. Aléjate un poco de la cámara.',
  too_far: () => 'Estás demasiado lejos. Acércate un poco a la cámara.',
  low_confidence: () => 'Se te ve poco claro. Mejora la luz y evita fondos que se confundan con tu ropa.',
  seated: (exercise) => `Estás sentado: ponte de pie para empezar ${exercise === 'deadlift' ? 'el peso muerto' : exercise === 'lunge' ? 'la zancada' : 'la sentadilla'}.`,
  lying: (exercise) => `Estás tumbado: ponte de pie para empezar ${exercise === 'deadlift' ? 'el peso muerto' : exercise === 'lunge' ? 'la zancada' : 'la sentadilla'}.`,
  not_horizontal: (exercise) => `Colócate en posición de ${exercise === 'plank' ? 'plancha' : 'flexión'}: cuerpo horizontal, apoyado en el suelo.`,
  front_facing: () => 'Colócate de lado a la cámara para ver la línea de tu cuerpo.',
  facing_away: () => 'No veo tu cara. Gírate hacia la cámara o de lado y deja la cabeza dentro del encuadre.',
}

const SEEN = 0.3
const NOSE = 0
const EYES_EARS = [1, 2, 3, 4]
const L = { shoulder: 5, elbow: 7, wrist: 9, hip: 11, knee: 13, ankle: 15 }
const R = { shoulder: 6, elbow: 8, wrist: 10, hip: 12, knee: 14, ankle: 16 }
type Side = typeof L

export type ValidationContext = {
  /** Ya se vio al usuario en la postura inicial: las posturas del movimiento (sentadilla profunda…) son válidas. */
  started: boolean
}

function seen(points: PosePoint[], index: number): PosePoint | null {
  const value = points[index]
  return value && value.confidence >= SEEN ? value : null
}

/** Lado del cuerpo con la cadena hombro-cadera-rodilla-tobillo más completa y fiable. */
function bestSide(points: PosePoint[], keys: Array<keyof Side>): Side {
  const score = (side: Side) => keys.reduce((sum, key) => sum + (points[side[key]]?.confidence ?? 0), 0)
  return score(L) >= score(R) ? L : R
}

function ok(): FramingResult {
  return { kind: 'ok', message: '' }
}

function fail(kind: Exclude<FramingKind, 'ok'>, exercise: Exercise): FramingResult {
  return { kind, message: FRAMING_MESSAGES[kind](exercise) }
}

/**
 * Comprueba encuadre y postura inicial ANTES de contar o corregir. Es una función pura
 * sobre un solo fotograma; el antirrebote entre fotogramas lo hace `FramingGate`.
 */
export function validateFraming(points: PosePoint[], exercise: Exercise, context: ValidationContext = { started: false }): FramingResult {
  const expected = START_POSTURE[exercise]
  const confident = points.filter((point) => point.confidence >= SEEN)
  if (confident.length < 4) return fail('not_visible', exercise)

  const side = bestSide(points, ['shoulder', 'hip', 'knee', 'ankle'])
  const shoulder = seen(points, side.shoulder)
  const hip = seen(points, side.hip)
  const knee = seen(points, side.knee)
  const ankle = seen(points, side.ankle)

  // Torso mínimo: sin hombro y cadera no se puede juzgar nada.
  if (!shoulder || !hip) return fail(confident.length < 6 ? 'not_visible' : 'partial_body', exercise)

  // Cuerpo cortado por el borde del encuadre o demasiado grande.
  const xs = confident.map((point) => point.x)
  const ys = confident.map((point) => point.y)
  const height = Math.max(...ys) - Math.min(...ys)
  const width = Math.max(...xs) - Math.min(...xs)
  const extent = Math.max(height, width)
  const touchesEdge = confident.filter((point) => point.x < 0.015 || point.x > 0.985 || point.y < 0.015 || point.y > 0.985).length >= 2
  if (extent > 0.93 || (touchesEdge && extent > 0.8)) return fail('too_close', exercise)
  if (extent < 0.2) return fail('too_far', exercise)

  const torsoLength = Math.hypot(shoulder.x - hip.x, shoulder.y - hip.y)
  const torsoDy = hip.y - shoulder.y
  const torsoDx = Math.abs(hip.x - shoulder.x)
  const torsoVertical = torsoDy > 0 && torsoDy >= torsoDx * 0.9
  const torsoHorizontal = torsoDx > Math.abs(torsoDy) * 1.2

  if (expected === 'standing' && !context.started) {
    // Tumbado: torso horizontal.
    if (torsoHorizontal) return fail('lying', exercise)
    // Sentado: torso erguido pero el muslo (cadera-rodilla) apenas baja en vertical frente al torso.
    if (knee && torsoVertical && torsoLength > 0.04) {
      const thighDy = knee.y - hip.y
      if (thighDy < torsoLength * 0.5) return fail('seated', exercise)
    }
  }

  // Piernas fuera del encuadre.
  if (!knee || !ankle) return fail('partial_legs', exercise)

  if (expected === 'horizontal') {
    const dx = Math.abs(ankle.x - shoulder.x)
    const dy = Math.abs(ankle.y - shoulder.y)
    if (dx < dy * 1.1) return fail('not_horizontal', exercise)
    // De frente la anchura de hombros es grande frente al torso (que se acorta en perspectiva).
    const otherShoulder = seen(points, side === L ? R.shoulder : L.shoulder)
    if (otherShoulder && Math.hypot(otherShoulder.x - shoulder.x, otherShoulder.y - shoulder.y) > Math.max(torsoLength, 0.05) * 0.9 && torsoLength < 0.12) {
      return fail('front_facing', exercise)
    }
  }

  // De espaldas o cabeza fuera de cuadro: ni nariz, ni ojos, ni orejas con hombros nítidos.
  if (expected === 'standing' && !context.started && shoulder.confidence >= 0.5) {
    const face = [NOSE, ...EYES_EARS].some((index) => (points[index]?.confidence ?? 0) >= 0.25)
    if (!face) return fail('facing_away', exercise)
  }

  // Confianza media de la cadena imprescindible.
  const chain = [shoulder, hip, knee, ankle]
  const mean = chain.reduce((sum, point) => sum + point.confidence, 0) / chain.length
  if (mean < 0.45) return fail('low_confidence', exercise)

  return ok()
}

export type GateOutput = {
  /** Estado estable (ya antirrebotado). */
  kind: FramingKind
  message: string
  /** Verdadero solo en el fotograma en que el estado estable cambia de tipo. */
  changed: boolean
  /** Falso hasta que el antirrebote tomó su primera decisión (no hablar antes). */
  confirmed: boolean
}

/**
 * Antirrebote entre fotogramas: un problema debe repetirse `issueFrames` veces seguidas para mostrarse
 * y la pose válida `okFrames` para limpiarlo. Evita parpadeos y mensajes que cambian cada frame.
 */
export class FramingGate {
  private stable: FramingResult = { kind: 'not_visible', message: FRAMING_MESSAGES.not_visible('squat') }
  private candidate: FramingKind = 'not_visible'
  private streak = 0
  private started = false
  private confirmed = false

  constructor(
    private readonly issueFrames = 3,
    private readonly okFrames = 2,
  ) {}

  /** Marca que ya hubo una pose inicial válida (permite posturas propias del movimiento). */
  setStarted(value: boolean): void {
    this.started = value
  }

  get isStarted(): boolean {
    return this.started
  }

  reset(): void {
    this.stable = { kind: 'not_visible', message: FRAMING_MESSAGES.not_visible('squat') }
    this.candidate = 'not_visible'
    this.streak = 0
    this.started = false
    this.confirmed = false
  }

  push(points: PosePoint[], exercise: Exercise): GateOutput {
    const result = validateFraming(points, exercise, { started: this.started })
    if (result.kind === this.candidate) this.streak += 1
    else {
      this.candidate = result.kind
      this.streak = 1
    }
    const needed = result.kind === 'ok' ? this.okFrames : this.issueFrames
    let changed = false
    if (this.streak >= needed) this.confirmed = true
    if (this.streak >= needed && result.kind !== this.stable.kind) {
      this.stable = result
      changed = true
    } else if (this.streak >= needed) {
      this.stable = result
    }
    if (this.stable.kind === 'ok') this.started = true
    return { kind: this.stable.kind, message: this.stable.message, changed, confirmed: this.confirmed }
  }
}

/** Mensaje de voz con prioridad: cancela lo anterior y respeta enfriamiento por tipo. */
export class VoiceCoach {
  private last = new Map<string, number>()

  constructor(
    private readonly speak: (text: string) => void,
    private readonly stop: () => void,
    private readonly cooldownMs: Record<string, number> = {},
    private readonly defaultCooldownMs = 6000,
  ) {}

  /** Devuelve true si se habló. `kind` identifica el tipo de mensaje (p. ej. `seated`, `rep`). */
  say(kind: string, text: string, now: number): boolean {
    const cooldown = this.cooldownMs[kind] ?? this.defaultCooldownMs
    const previous = this.last.get(kind)
    if (previous !== undefined && now - previous < cooldown) return false
    this.last.set(kind, now)
    this.stop()
    this.speak(text)
    return true
  }

  reset(): void {
    this.last.clear()
    this.stop()
  }
}
