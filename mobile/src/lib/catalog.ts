import type { ExerciseId } from "./types";

/**
 * Catálogo de ejercicios del plan. Los cinco de siempre se miden con la cámara; las variantes de esos movimientos
 * (sentadilla sumo, flexión inclinada…) se miden con el mismo detector; el resto se hace con la guía ilustrada y se
 * marca por series, porque el contador por cámara solo entiende esos cinco patrones.
 */

export type CatalogId =
  | "squat" | "sumo_squat" | "lunge" | "reverse_lunge" | "bulgarian_split_squat" | "step_up" | "wall_sit"
  | "calf_raise" | "glute_bridge"
  | "deadlift" | "romanian_deadlift" | "good_morning" | "superman"
  | "push_up" | "incline_push_up" | "diamond_push_up" | "tricep_dips" | "shoulder_press"
  | "bent_over_row" | "biceps_curl"
  | "plank" | "side_plank" | "crunch" | "leg_raise" | "mountain_climber" | "bird_dog"
  | "jumping_jacks" | "high_knees" | "burpee";

export type Muscle = "piernas" | "glúteos" | "pecho" | "hombros" | "tríceps" | "espalda" | "bíceps" | "core" | "cardio";

export type Gear = "silla" | "mochila" | "pared" | "escalón" | null;

export interface CatalogEntry {
  id: CatalogId;
  label: string;
  muscle: Muscle;
  unit: "reps" | "seconds";
  /** Repeticiones (o segundos) de partida antes de ajustar por objetivo y nivel. */
  base: number;
  /** Se hace por lado (pierna o brazo): el plan lo avisa. */
  perSide?: boolean;
  /** Ejercicio de la cámara que lo mide; sin él, se hace con la guía y se marcan las series. */
  engine?: ExerciseId;
  gear: Gear;
  /** Aviso corto de material, p. ej. "con una silla firme". */
  gearNote?: string;
}

export const CATALOG: Record<CatalogId, CatalogEntry> = {
  squat: { id: "squat", label: "Sentadilla", muscle: "piernas", unit: "reps", base: 12, engine: "squat", gear: null },
  sumo_squat: { id: "sumo_squat", label: "Sentadilla sumo", muscle: "glúteos", unit: "reps", base: 12, engine: "squat", gear: null },
  lunge: { id: "lunge", label: "Zancada", muscle: "piernas", unit: "reps", base: 10, perSide: true, engine: "lunge", gear: null },
  reverse_lunge: { id: "reverse_lunge", label: "Zancada hacia atrás", muscle: "glúteos", unit: "reps", base: 10, perSide: true, engine: "lunge", gear: null },
  bulgarian_split_squat: { id: "bulgarian_split_squat", label: "Sentadilla búlgara", muscle: "piernas", unit: "reps", base: 8, perSide: true, engine: "lunge", gear: "silla", gearNote: "con el pie de atrás sobre una silla firme" },
  step_up: { id: "step_up", label: "Subida al escalón", muscle: "piernas", unit: "reps", base: 10, perSide: true, gear: "escalón", gearNote: "con un escalón o una silla firme" },
  wall_sit: { id: "wall_sit", label: "Sentadilla en la pared", muscle: "piernas", unit: "seconds", base: 30, gear: "pared" },
  calf_raise: { id: "calf_raise", label: "Elevación de talones", muscle: "piernas", unit: "reps", base: 15, gear: null },
  glute_bridge: { id: "glute_bridge", label: "Puente de glúteos", muscle: "glúteos", unit: "reps", base: 14, gear: null },

  deadlift: { id: "deadlift", label: "Peso muerto", muscle: "espalda", unit: "reps", base: 10, engine: "deadlift", gear: "mochila", gearNote: "con una mochila cargada o una mancuerna" },
  romanian_deadlift: { id: "romanian_deadlift", label: "Peso muerto rumano", muscle: "glúteos", unit: "reps", base: 10, engine: "deadlift", gear: "mochila", gearNote: "con una mochila cargada o una mancuerna" },
  good_morning: { id: "good_morning", label: "Buenos días (bisagra de cadera)", muscle: "espalda", unit: "reps", base: 12, engine: "deadlift", gear: null },
  superman: { id: "superman", label: "Superman", muscle: "espalda", unit: "reps", base: 12, gear: null },

  push_up: { id: "push_up", label: "Flexión", muscle: "pecho", unit: "reps", base: 10, engine: "push_up", gear: null },
  incline_push_up: { id: "incline_push_up", label: "Flexión inclinada", muscle: "pecho", unit: "reps", base: 12, engine: "push_up", gear: "silla", gearNote: "con las manos sobre una mesa o silla firme" },
  diamond_push_up: { id: "diamond_push_up", label: "Flexión diamante", muscle: "tríceps", unit: "reps", base: 8, engine: "push_up", gear: null },
  tricep_dips: { id: "tricep_dips", label: "Fondos de tríceps", muscle: "tríceps", unit: "reps", base: 10, gear: "silla", gearNote: "con una silla firme" },
  shoulder_press: { id: "shoulder_press", label: "Press de hombros", muscle: "hombros", unit: "reps", base: 10, gear: "mochila", gearNote: "con mancuernas, botellas de agua o una mochila" },

  bent_over_row: { id: "bent_over_row", label: "Remo inclinado", muscle: "espalda", unit: "reps", base: 10, gear: "mochila", gearNote: "con una mochila cargada o una mancuerna" },
  biceps_curl: { id: "biceps_curl", label: "Curl de bíceps", muscle: "bíceps", unit: "reps", base: 12, gear: "mochila", gearNote: "con mancuernas o botellas de agua" },

  plank: { id: "plank", label: "Plancha", muscle: "core", unit: "seconds", base: 40, engine: "plank", gear: null },
  side_plank: { id: "side_plank", label: "Plancha lateral", muscle: "core", unit: "seconds", base: 25, perSide: true, gear: null },
  crunch: { id: "crunch", label: "Abdominales (crunch)", muscle: "core", unit: "reps", base: 15, gear: null },
  leg_raise: { id: "leg_raise", label: "Elevación de piernas", muscle: "core", unit: "reps", base: 12, gear: null },
  mountain_climber: { id: "mountain_climber", label: "Escaladores", muscle: "cardio", unit: "seconds", base: 30, gear: null },
  bird_dog: { id: "bird_dog", label: "Perro de caza (bird dog)", muscle: "core", unit: "reps", base: 8, perSide: true, gear: null },

  jumping_jacks: { id: "jumping_jacks", label: "Saltos de tijera", muscle: "cardio", unit: "seconds", base: 40, gear: null },
  high_knees: { id: "high_knees", label: "Rodillas arriba", muscle: "cardio", unit: "seconds", base: 30, gear: null },
  burpee: { id: "burpee", label: "Burpee", muscle: "cardio", unit: "reps", base: 8, gear: null },
};

export const CATALOG_LIST: CatalogEntry[] = Object.values(CATALOG);

export function isCatalogId(value: string): value is CatalogId {
  return value in CATALOG;
}

export function catalogLabel(value: string): string {
  return isCatalogId(value) ? CATALOG[value].label : value.replace(/_/g, " ");
}
