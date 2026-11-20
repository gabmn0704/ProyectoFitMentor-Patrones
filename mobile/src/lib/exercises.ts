import type { ExerciseId } from "./types";

export interface ExerciseMeta {
  id: ExerciseId;
  label: string;
  /** Objetivo por defecto de repeticiones (segundos en plancha). */
  target: number;
  unit: "reps" | "seconds";
  /** Alias para el buscador, sin tildes. */
  aliases: string[];
}

export const EXERCISES: Record<ExerciseId, ExerciseMeta> = {
  squat: { id: "squat", label: "Sentadilla", target: 12, unit: "reps", aliases: ["sentadilla", "squat"] },
  push_up: { id: "push_up", label: "Flexión", target: 10, unit: "reps", aliases: ["flexion", "flexiones", "push up", "push-up"] },
  plank: { id: "plank", label: "Plancha", target: 60, unit: "seconds", aliases: ["plancha", "plank", "core"] },
  deadlift: { id: "deadlift", label: "Peso muerto", target: 10, unit: "reps", aliases: ["peso muerto", "deadlift", "muerto"] },
  lunge: { id: "lunge", label: "Zancada", target: 10, unit: "reps", aliases: ["zancada", "estocada", "lunge", "lunges"] },
};

export const EXERCISE_LIST: ExerciseMeta[] = Object.values(EXERCISES);

export function isExerciseId(value: string): value is ExerciseId {
  return value in EXERCISES;
}

/** Nombre legible para un id; si no es conocido, devuelve el id tal cual. */
export function exerciseLabel(value: string): string {
  return isExerciseId(value) ? EXERCISES[value].label : value.replace(/_/g, " ");
}
