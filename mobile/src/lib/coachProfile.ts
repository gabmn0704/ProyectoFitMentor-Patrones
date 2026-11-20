import { currentWeek, goalName, type BodyProfile, type FitnessGoal } from "./profile";
import { nutritionTargets } from "./nutrition";

/** Perfil que viaja con cada pregunta al coach. Solo enumeraciones y números: el servidor lo valida. */
export interface CoachProfilePayload {
  goal: FitnessGoal;
  weightKg: number;
  heightCm: number;
  age?: number;
  sex?: "female" | "male";
  targetWeightKg?: number;
  weeks: number;
  week: number;
  daysPerWeek: number;
  diet: "omnivore" | "vegetarian";
  kcal: number;
  proteinG: number;
}

export function coachProfilePayload(profile: BodyProfile, now = new Date()): CoachProfilePayload {
  const targets = nutritionTargets(profile);
  return {
    goal: profile.goal,
    weightKg: profile.weightKg,
    heightCm: profile.heightCm,
    ...(profile.age !== null ? { age: profile.age } : {}),
    ...(profile.sex !== null ? { sex: profile.sex } : {}),
    ...(profile.targetWeightKg !== null ? { targetWeightKg: profile.targetWeightKg } : {}),
    weeks: profile.weeks,
    week: Math.min(currentWeek(profile, now), 104),
    daysPerWeek: profile.daysPerWeek,
    diet: profile.diet,
    kcal: targets.kcal,
    proteinG: targets.proteinG,
  };
}

const BASE_SUGGESTIONS = [
  "¿Cómo mejoro la profundidad de la sentadilla?",
  "¿Qué hago si me duele la rodilla al bajar?",
  "Dame una rutina corta de 15 minutos",
  "¿Cuántas repeticiones debería hacer por semana?",
];

const BY_GOAL: Record<FitnessGoal, string[]> = {
  lose_fat: ["¿Qué ceno hoy para bajar de peso?", "¿Cuántas calorías debo comer al día?", "¿Cómo no abandonar la dieta el fin de semana?"],
  build_muscle: ["¿Cuánta proteína necesito para ganar músculo?", "¿Qué como después de entrenar?", "¿Cómo progreso en la sentadilla?"],
  tone: ["¿Cómo defino sin perder fuerza?", "¿Cuántos días debo entrenar para tonificar?", "¿Qué como antes de entrenar?"],
  endurance: ["¿Cómo aguanto más repeticiones?", "¿Qué como antes de un entrenamiento largo?", "¿Cuánto descanso entre series?"],
  health: ["¿Cómo empiezo una rutina sin lesionarme?", "¿Cuánta agua debo tomar?", "¿Cómo duermo mejor para recuperarme?"],
};

/** Preguntas de ejemplo: las del objetivo de la persona y una de técnica. */
export function coachSuggestions(goal: FitnessGoal | undefined): string[] {
  if (!goal) return BASE_SUGGESTIONS;
  return [...BY_GOAL[goal], BASE_SUGGESTIONS[0]];
}

export function coachWelcome(name: string | undefined, goal: FitnessGoal | undefined): string {
  const first = name?.trim().split(/\s+/)[0];
  const hello = first ? `Hola, ${first}.` : "Hola.";
  if (!goal) return `${hello} Soy tu coach: pregúntame por postura, rutinas, descanso o alimentación.`;
  return `${hello} Voy a acompañarte en tu meta de ${goalName(goal).toLowerCase()}. Pregúntame lo que quieras sobre técnica, tu rutina o qué comer.`;
}
