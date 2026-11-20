import { kv } from "./storage";
import type { Avoid } from "./foods";

/**
 * Perfil físico y de objetivo de la persona. Se pregunta tras el primer inicio de sesión y se guarda en
 * este dispositivo, separado por usuario. Alimenta la rutina semanal, el plan de alimentación y al coach.
 */

export type FitnessGoal = "lose_fat" | "build_muscle" | "tone" | "endurance" | "health";
export type Sex = "female" | "male";
export type Diet = "omnivore" | "vegetarian";

export interface BodyProfile {
  goal: FitnessGoal;
  weightKg: number;
  heightCm: number;
  /** Años; null si la persona prefiere no decirlo (se usa 30 en los cálculos). */
  age: number | null;
  sex: Sex | null;
  /** Peso al que quiere llegar; solo tiene sentido al bajar de peso o ganar masa. */
  targetWeightKg: number | null;
  /** Semanas en las que quiere lograrlo. */
  weeks: number;
  daysPerWeek: 3 | 4 | 5 | 6;
  diet: Diet;
  /** Alimentos que la persona no come (alergia, creencia o gusto); el plan los excluye. */
  avoid?: Avoid[];
  /** ISO 8601 del día en que empezó el plan; marca la semana actual. */
  startedAt: string;
}

export const GOAL_OPTIONS: ReadonlyArray<{ value: FitnessGoal; label: string; hint: string }> = [
  { value: "lose_fat", label: "Bajar de peso", hint: "Perder grasa conservando músculo" },
  { value: "build_muscle", label: "Ganar masa muscular", hint: "Más fuerza y volumen" },
  { value: "tone", label: "Tonificar", hint: "Definir y mejorar la composición corporal" },
  { value: "endurance", label: "Resistencia", hint: "Aguantar más y recuperarte mejor" },
  { value: "health", label: "Salud y bienestar", hint: "Moverte mejor y mantener el peso" },
];

export function goalName(goal: FitnessGoal): string {
  return GOAL_OPTIONS.find((option) => option.value === goal)?.label ?? goal;
}

/** Objetivos en los que el peso meta cambia el cálculo. */
export function goalUsesTargetWeight(goal: FitnessGoal): boolean {
  return goal === "lose_fat" || goal === "build_muscle";
}

export const LIMITS = {
  weightKg: { min: 30, max: 250 },
  heightCm: { min: 120, max: 230 },
  age: { min: 14, max: 90 },
  weeks: { min: 4, max: 52 },
} as const;

export type ProfileErrors = Partial<Record<"weightKg" | "heightCm" | "age" | "targetWeightKg" | "weeks", string>>;

const inRange = (value: number, range: { min: number; max: number }) =>
  Number.isFinite(value) && value >= range.min && value <= range.max;

/** Valida el borrador del asistente. Devuelve un mensaje por campo con problema. */
export function validateProfile(draft: Partial<BodyProfile>): ProfileErrors {
  const errors: ProfileErrors = {};
  if (!inRange(draft.weightKg ?? NaN, LIMITS.weightKg)) {
    errors.weightKg = `Escribe tu peso entre ${LIMITS.weightKg.min} y ${LIMITS.weightKg.max} kg.`;
  }
  if (!inRange(draft.heightCm ?? NaN, LIMITS.heightCm)) {
    errors.heightCm = `Escribe tu altura entre ${LIMITS.heightCm.min} y ${LIMITS.heightCm.max} cm.`;
  }
  if (draft.age !== null && draft.age !== undefined && !inRange(draft.age, LIMITS.age)) {
    errors.age = `La edad debe estar entre ${LIMITS.age.min} y ${LIMITS.age.max} años.`;
  }
  if (!inRange(draft.weeks ?? NaN, LIMITS.weeks)) {
    errors.weeks = `El plazo va de ${LIMITS.weeks.min} a ${LIMITS.weeks.max} semanas.`;
  }
  if (draft.goal && goalUsesTargetWeight(draft.goal)) {
    const target = draft.targetWeightKg;
    if (target === null || target === undefined || !inRange(target, LIMITS.weightKg)) {
      errors.targetWeightKg = "Escribe el peso al que quieres llegar.";
    } else if (draft.weightKg !== undefined) {
      if (draft.goal === "lose_fat" && target >= draft.weightKg) {
        errors.targetWeightKg = "Para bajar de peso, tu meta debe ser menor que tu peso actual.";
      }
      if (draft.goal === "build_muscle" && target <= draft.weightKg) {
        errors.targetWeightKg = "Para ganar masa, tu meta debe ser mayor que tu peso actual.";
      }
    }
  }
  return errors;
}

export function bmi(profile: Pick<BodyProfile, "weightKg" | "heightCm">): number {
  const meters = profile.heightCm / 100;
  return Math.round((profile.weightKg / (meters * meters)) * 10) / 10;
}

export function bmiCategory(value: number): string {
  if (value < 18.5) return "Bajo peso";
  if (value < 25) return "Peso saludable";
  if (value < 30) return "Sobrepeso";
  return "Obesidad";
}

/** Semana actual del plan (1 es la primera). */
export function currentWeek(profile: Pick<BodyProfile, "startedAt">, now = new Date()): number {
  const start = new Date(profile.startedAt).getTime();
  if (Number.isNaN(start)) return 1;
  const days = Math.floor((now.getTime() - start) / 86_400_000);
  return Math.max(1, Math.floor(days / 7) + 1);
}

const keyFor = (userId: string): string => `fitmentor.profile.${userId}`;

export function isProfile(value: unknown): value is BodyProfile {
  if (!value || typeof value !== "object") return false;
  const p = value as Partial<BodyProfile>;
  return (
    GOAL_OPTIONS.some((option) => option.value === p.goal) &&
    typeof p.weightKg === "number" &&
    typeof p.heightCm === "number" &&
    typeof p.weeks === "number" &&
    typeof p.startedAt === "string"
  );
}

export async function loadProfile(userId: string | undefined | null): Promise<BodyProfile | null> {
  if (!userId) return null;
  const saved = await kv.getJSON<unknown>(keyFor(userId), null);
  return isProfile(saved) ? saved : null;
}

export async function saveProfile(userId: string, profile: BodyProfile): Promise<void> {
  await kv.setJSON(keyFor(userId), profile);
}

export async function clearProfile(userId: string): Promise<void> {
  await kv.remove(keyFor(userId));
}
