import type { ExerciseId, Level } from "./types";
import type { BodyProfile, FitnessGoal } from "./profile";
import { CATALOG, type CatalogId } from "./catalog";
import { nutritionTargets } from "./nutrition";

/**
 * Rutina semanal personalizada. Cada objetivo tiene su propio repertorio de ejercicios (no es el mismo plan con otra
 * intensidad), reparte los días que la persona puede entrenar, alterna dos variantes de cada sesión semana a semana y
 * sube la carga tres semanas con una de descarga.
 */

export interface PlanItem {
  exercise: CatalogId;
  sets: number;
  /** Repeticiones, o segundos si el ejercicio es isométrico o de cardio. */
  target: number;
  unit: "reps" | "seconds";
  restSec: number;
  note: string;
  /** Ejercicio de la cámara que lo mide; sin él, se hace con la guía y se marcan las series. */
  engine?: ExerciseId;
  /** Se hace por lado (pierna o brazo). */
  perSide: boolean;
}

export interface DayPlan {
  /** 0 = lunes … 6 = domingo. */
  index: number;
  name: string;
  kind: "train" | "rest";
  title: string;
  focus: string;
  items: PlanItem[];
  minutes: number;
}

export interface WeekPlan {
  week: number;
  /** Cuarta semana de cada bloque: menos volumen para recuperar. */
  deload: boolean;
  theme: string;
  days: DayPlan[];
}

export const DAY_NAMES = ["Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado", "Domingo"] as const;
export const DAY_SHORT = ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"] as const;

type Session = "legs" | "push" | "full" | "circuit";

const SESSION_TEXT: Record<Session, { title: string; focus: string }> = {
  legs: { title: "Piernas y glúteos", focus: "Piernas, glúteos y core: la base de tu fuerza y de tu gasto de energía." },
  push: { title: "Empuje, tirón y core", focus: "Pecho, hombros, brazos y espalda, con trabajo de abdomen para cerrar." },
  full: { title: "Cuerpo completo", focus: "Un ejercicio por cada gran patrón de movimiento." },
  circuit: { title: "Circuito", focus: "Pasa de un ejercicio al siguiente con poca pausa para subir el pulso." },
};

/** Repertorio por objetivo y sesión: dos variantes que se alternan semana a semana. */
const POOLS: Record<FitnessGoal, Record<Session, CatalogId[][]>> = {
  lose_fat: {
    legs: [
      ["squat", "reverse_lunge", "glute_bridge", "mountain_climber", "plank"],
      ["sumo_squat", "step_up", "romanian_deadlift", "jumping_jacks", "crunch"],
    ],
    push: [
      ["push_up", "shoulder_press", "tricep_dips", "burpee", "plank"],
      ["incline_push_up", "bent_over_row", "high_knees", "side_plank", "leg_raise"],
    ],
    full: [
      ["squat", "push_up", "bent_over_row", "burpee", "plank"],
      ["lunge", "diamond_push_up", "good_morning", "mountain_climber", "crunch"],
    ],
    circuit: [
      ["jumping_jacks", "squat", "push_up", "high_knees", "mountain_climber", "plank"],
      ["burpee", "sumo_squat", "incline_push_up", "step_up", "leg_raise", "side_plank"],
    ],
  },
  build_muscle: {
    legs: [
      ["bulgarian_split_squat", "romanian_deadlift", "squat", "calf_raise", "plank"],
      ["lunge", "deadlift", "glute_bridge", "wall_sit", "side_plank"],
    ],
    push: [
      ["push_up", "shoulder_press", "tricep_dips", "diamond_push_up", "crunch"],
      ["incline_push_up", "bent_over_row", "biceps_curl", "shoulder_press", "leg_raise"],
    ],
    full: [
      ["squat", "push_up", "bent_over_row", "romanian_deadlift", "plank"],
      ["bulgarian_split_squat", "diamond_push_up", "biceps_curl", "glute_bridge", "side_plank"],
    ],
    circuit: [
      ["squat", "push_up", "bent_over_row", "lunge", "biceps_curl", "plank"],
      ["sumo_squat", "tricep_dips", "good_morning", "shoulder_press", "crunch", "bird_dog"],
    ],
  },
  tone: {
    legs: [
      ["sumo_squat", "reverse_lunge", "glute_bridge", "calf_raise", "side_plank"],
      ["squat", "step_up", "good_morning", "wall_sit", "leg_raise"],
    ],
    push: [
      ["incline_push_up", "shoulder_press", "biceps_curl", "tricep_dips", "plank"],
      ["push_up", "bent_over_row", "diamond_push_up", "crunch", "bird_dog"],
    ],
    full: [
      ["squat", "push_up", "glute_bridge", "bent_over_row", "side_plank"],
      ["lunge", "incline_push_up", "romanian_deadlift", "biceps_curl", "crunch"],
    ],
    circuit: [
      ["jumping_jacks", "sumo_squat", "push_up", "mountain_climber", "glute_bridge", "plank"],
      ["high_knees", "lunge", "tricep_dips", "superman", "leg_raise", "side_plank"],
    ],
  },
  endurance: {
    legs: [
      ["squat", "step_up", "high_knees", "wall_sit", "plank"],
      ["reverse_lunge", "jumping_jacks", "calf_raise", "glute_bridge", "mountain_climber"],
    ],
    push: [
      ["push_up", "mountain_climber", "bent_over_row", "bird_dog", "plank"],
      ["incline_push_up", "burpee", "shoulder_press", "side_plank", "crunch"],
    ],
    full: [
      ["squat", "push_up", "jumping_jacks", "lunge", "plank"],
      ["sumo_squat", "diamond_push_up", "high_knees", "good_morning", "mountain_climber"],
    ],
    circuit: [
      ["jumping_jacks", "squat", "push_up", "high_knees", "mountain_climber", "burpee"],
      ["high_knees", "reverse_lunge", "incline_push_up", "step_up", "jumping_jacks", "plank"],
    ],
  },
  health: {
    legs: [
      ["sumo_squat", "glute_bridge", "calf_raise", "bird_dog", "plank"],
      ["squat", "step_up", "good_morning", "wall_sit", "superman"],
    ],
    push: [
      ["incline_push_up", "bent_over_row", "shoulder_press", "bird_dog", "plank"],
      ["push_up", "biceps_curl", "tricep_dips", "crunch", "side_plank"],
    ],
    full: [
      ["squat", "incline_push_up", "glute_bridge", "bent_over_row", "plank"],
      ["lunge", "push_up", "good_morning", "bird_dog", "crunch"],
    ],
    circuit: [
      ["jumping_jacks", "sumo_squat", "incline_push_up", "bird_dog", "glute_bridge"],
      ["high_knees", "reverse_lunge", "tricep_dips", "superman", "plank"],
    ],
  },
};

/** Versiones más accesibles para quien empieza. */
const EASIER: Partial<Record<CatalogId, CatalogId>> = {
  burpee: "high_knees",
  diamond_push_up: "incline_push_up",
  bulgarian_split_squat: "reverse_lunge",
  deadlift: "romanian_deadlift",
  tricep_dips: "biceps_curl",
};

const TRAIN_DAYS: Record<3 | 4 | 5 | 6, number[]> = {
  3: [0, 2, 4],
  4: [0, 1, 3, 4],
  5: [0, 1, 2, 4, 5],
  6: [0, 1, 2, 3, 4, 5],
};

const SESSION_ORDER: Record<3 | 4 | 5 | 6, Session[]> = {
  3: ["full", "legs", "push"],
  4: ["legs", "push", "full", "circuit"],
  5: ["legs", "push", "full", "circuit", "legs"],
  6: ["legs", "push", "full", "legs", "push", "circuit"],
};

interface GoalStyle {
  /** Multiplicador de repeticiones respecto de un plan «medio» de 12. */
  repsRatio: number;
  /** Multiplicador de segundos en ejercicios isométricos y de cardio. */
  secondsRatio: number;
  rest: number;
  tip: string;
}

const GOAL_STYLE: Record<FitnessGoal, GoalStyle> = {
  lose_fat: { repsRatio: 1.25, secondsRatio: 1, rest: 40, tip: "Descansa poco entre series: mantener el pulso alto ayuda a gastar más energía." },
  build_muscle: { repsRatio: 0.85, secondsRatio: 1.1, rest: 90, tip: "Baja en tres segundos y sube con fuerza; las últimas repeticiones deben costar." },
  tone: { repsRatio: 1, secondsRatio: 1, rest: 60, tip: "Controla cada repetición y no rebotes abajo: tonifica quien mantiene la tensión." },
  endurance: { repsRatio: 1.5, secondsRatio: 1.4, rest: 30, tip: "Mantén un ritmo constante y respira al subir; la pausa es corta a propósito." },
  health: { repsRatio: 0.85, secondsRatio: 0.85, rest: 60, tip: "Prioriza la técnica y sal con energía: la constancia pesa más que la intensidad." },
};

const LEVEL_SETS: Record<Level, number> = { BEGINNER: 2, INTERMEDIATE: 3, ADVANCED: 4 };
const LEVEL_REPS: Record<Level, number> = { BEGINNER: 0.8, INTERMEDIATE: 1, ADVANCED: 1.1 };
const LEVEL_SECONDS: Record<Level, number> = { BEGINNER: 0, INTERMEDIATE: 5, ADVANCED: 15 };

const BLOCK_THEMES = ["Construyes la base", "Subes el volumen", "Semana de más exigencia", "Descarga: recuperas para progresar"];

const round = (value: number) => Math.round(value);

function itemFor(exercise: CatalogId, goal: FitnessGoal, level: Level, week: number): PlanItem {
  const entry = CATALOG[exercise];
  const style = GOAL_STYLE[goal];
  const position = (week - 1) % 4;
  const block = Math.floor((week - 1) / 4);
  const deload = position === 3;
  const sets = Math.max(2, LEVEL_SETS[level] - (deload ? 1 : 0));

  let target: number;
  if (entry.unit === "seconds") {
    const seconds = entry.base * style.secondsRatio + LEVEL_SECONDS[level] + position * 5 + block * 10;
    target = Math.min(150, round(deload ? seconds * 0.7 : seconds));
  } else {
    const base = entry.base * style.repsRatio * LEVEL_REPS[level];
    const progressed = base + Math.min(position, 2) + block;
    target = Math.max(5, round(deload ? progressed * 0.7 : progressed));
  }

  const parts: string[] = [];
  if (entry.perSide) parts.push("Haz todas las repeticiones de un lado y luego del otro.");
  if (entry.gearNote) parts.push(`${entry.gearNote[0].toUpperCase()}${entry.gearNote.slice(1)}.`);
  if (exercise === "push_up" && level === "BEGINNER") parts.push("Si no puedes con el cuerpo completo, apoya las rodillas sin perder la línea.");
  const note = parts.length ? parts.join(" ") : style.tip;

  return { exercise, sets, target, unit: entry.unit, restSec: style.rest, note, engine: entry.engine, perSide: Boolean(entry.perSide) };
}

function minutesFor(items: PlanItem[]): number {
  const seconds = items.reduce((acc, item) => {
    const work = item.unit === "seconds" ? item.target : item.target * 3.5;
    return acc + item.sets * ((item.perSide ? work * 2 : work) + item.restSec);
  }, 0);
  return Math.round(seconds / 60) + 6;
}

/** Ejercicios de una sesión: la variante de la semana, adaptada al nivel y sin repetir ninguno. */
function exercisesFor(goal: FitnessGoal, session: Session, level: Level, week: number, occurrence: number): CatalogId[] {
  const variants = POOLS[goal][session];
  const picked = variants[(week - 1 + occurrence) % variants.length];
  const adapted = picked.map((id) => (level === "BEGINNER" ? (EASIER[id] ?? id) : id));
  return adapted.filter((id, index) => adapted.indexOf(id) === index);
}

/** Rutina de la semana `week` (1 es la primera) para la persona y su nivel. */
export function buildWeekPlan(profile: BodyProfile, level: Level, week: number): WeekPlan {
  const position = (week - 1) % 4;
  const days = TRAIN_DAYS[profile.daysPerWeek];
  const order = SESSION_ORDER[profile.daysPerWeek];

  const plan: DayPlan[] = DAY_NAMES.map((name, index) => {
    const slot = days.indexOf(index);
    if (slot === -1) {
      return {
        index,
        name,
        kind: "rest",
        title: "Descanso activo",
        focus: "Camina 20 a 30 minutos y haz algo de movilidad. El músculo crece y la técnica se asienta mientras descansas.",
        items: [],
        minutes: 0,
      };
    }
    const session = order[slot];
    const occurrence = order.slice(0, slot).filter((earlier) => earlier === session).length;
    const items = exercisesFor(profile.goal, session, level, week, occurrence).map((exercise) => itemFor(exercise, profile.goal, level, week));
    const text = SESSION_TEXT[session];
    return { index, name, kind: "train", title: text.title, focus: text.focus, items, minutes: minutesFor(items) };
  });

  return { week, deload: position === 3, theme: BLOCK_THEMES[position], days: plan };
}

/** Índice de hoy con lunes = 0. */
export function todayIndex(now = new Date()): number {
  return (now.getDay() + 6) % 7;
}

/** Peso que debería marcar la báscula al final de la semana `week` si sigues el plan. */
export function expectedWeightKg(profile: BodyProfile, week: number): number {
  const change = nutritionTargets(profile).weeklyChangeKg;
  const reached = Math.min(week, profile.weeks);
  const value = profile.weightKg + change * reached;
  if (profile.targetWeightKg === null) return Math.round(value * 10) / 10;
  const low = Math.min(profile.weightKg, profile.targetWeightKg);
  const high = Math.max(profile.weightKg, profile.targetWeightKg);
  return Math.round(Math.min(high, Math.max(low, value)) * 10) / 10;
}
