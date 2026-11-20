import { bmi, goalUsesTargetWeight, type BodyProfile, type FitnessGoal } from "./profile";

/**
 * Cálculo de calorías, macros y comidas a partir del perfil. Las cuentas son estándar (Mifflin-St Jeor para el
 * metabolismo basal) y siempre se limitan a ritmos seguros: es orientación general, no consejo médico.
 */

const KCAL_PER_KG = 7700;

export interface Macros {
  kcal: number;
  proteinG: number;
  carbsG: number;
  fatG: number;
}

export interface NutritionTargets extends Macros {
  bmr: number;
  tdee: number;
  /** Cambio de peso semanal buscado, en kg (negativo al bajar). */
  weeklyChangeKg: number;
  waterL: number;
  /** Avisos sobre el plazo o el ritmo, en español, para mostrar a la persona. */
  notes: string[];
}

/** Metabolismo basal (kcal/día) con Mifflin-St Jeor; sin sexo se promedia. */
export function bmr(profile: Pick<BodyProfile, "weightKg" | "heightCm" | "age" | "sex">): number {
  const age = profile.age ?? 30;
  const base = 10 * profile.weightKg + 6.25 * profile.heightCm - 5 * age;
  const offset = profile.sex === "male" ? 5 : profile.sex === "female" ? -161 : -78;
  return Math.round(base + offset);
}

/** Gasto diario total: el metabolismo basal por un factor que crece con los días de entrenamiento. */
export function tdee(profile: Pick<BodyProfile, "weightKg" | "heightCm" | "age" | "sex" | "daysPerWeek">): number {
  const factor = 1.2 + 0.075 * profile.daysPerWeek;
  return Math.round(bmr(profile) * factor);
}

const PROTEIN_PER_KG: Record<FitnessGoal, number> = {
  lose_fat: 2.0,
  build_muscle: 1.9,
  tone: 1.9,
  endurance: 1.5,
  health: 1.4,
};

const round5 = (value: number) => Math.round(value / 5) * 5;

function kcalFloor(sex: BodyProfile["sex"]): number {
  return sex === "male" ? 1500 : sex === "female" ? 1200 : 1350;
}

/** Meta diaria de calorías y macros para un día de entrenamiento (o de descanso, con menos carbohidrato). */
export function nutritionTargets(profile: BodyProfile, trainingDay = true): NutritionTargets {
  const notes: string[] = [];
  const maintenance = tdee(profile);
  let weeklyChangeKg = 0;
  let kcal = maintenance;

  if (profile.goal === "lose_fat" && profile.targetWeightKg !== null) {
    const wanted = (profile.weightKg - profile.targetWeightKg) / profile.weeks;
    const safeMax = Math.max(0.25, profile.weightKg * 0.01);
    const rate = Math.min(Math.max(wanted, 0.1), safeMax);
    if (wanted > safeMax) {
      const safeWeeks = Math.ceil((profile.weightKg - profile.targetWeightKg) / safeMax);
      notes.push(
        `Bajar ${(profile.weightKg - profile.targetWeightKg).toFixed(1)} kg en ${profile.weeks} semanas es demasiado rápido. ` +
          `Usamos un ritmo seguro de ${safeMax.toFixed(2)} kg por semana: llegarías en unas ${safeWeeks} semanas.`,
      );
    }
    weeklyChangeKg = -rate;
    const deficit = Math.min((rate * KCAL_PER_KG) / 7, maintenance * 0.25);
    kcal = maintenance - deficit;
  } else if (profile.goal === "build_muscle" && profile.targetWeightKg !== null) {
    const wanted = (profile.targetWeightKg - profile.weightKg) / profile.weeks;
    const safeMax = Math.max(0.2, profile.weightKg * 0.005);
    const rate = Math.min(Math.max(wanted, 0.1), safeMax);
    if (wanted > safeMax) {
      const safeWeeks = Math.ceil((profile.targetWeightKg - profile.weightKg) / safeMax);
      notes.push(
        `Subir ${(profile.targetWeightKg - profile.weightKg).toFixed(1)} kg en ${profile.weeks} semanas añadiría más grasa que músculo. ` +
          `Usamos ${safeMax.toFixed(2)} kg por semana: llegarías en unas ${safeWeeks} semanas.`,
      );
    }
    weeklyChangeKg = rate;
    const surplus = Math.min((rate * KCAL_PER_KG) / 7, maintenance * 0.2);
    kcal = maintenance + Math.max(surplus, 150);
  } else if (profile.goal === "tone") {
    kcal = maintenance * 0.92;
    weeklyChangeKg = -((maintenance - kcal) * 7) / KCAL_PER_KG;
    notes.push("Déficit suave para definir sin perder rendimiento: el cambio se ve más en la forma que en la báscula.");
  } else if (profile.goal === "endurance") {
    kcal = maintenance * 1.05;
  }

  const floor = kcalFloor(profile.sex);
  if (kcal < floor) {
    kcal = floor;
    notes.push(`Subimos las calorías al mínimo seguro de ${floor} kcal. Por debajo de eso no es recomendable sin supervisión médica.`);
  }

  // Día de descanso: algo menos de carbohidrato (≈ 8 % de las calorías).
  const dayKcal = trainingDay ? kcal : kcal * 0.92;

  const proteinG = Math.round(PROTEIN_PER_KG[profile.goal] * profile.weightKg);
  const fatG = Math.round(Math.max(0.7 * profile.weightKg, (dayKcal * 0.27) / 9));
  const carbsG = Math.max(60, Math.round((dayKcal - proteinG * 4 - fatG * 9) / 4));
  const total = Math.round(proteinG * 4 + carbsG * 4 + fatG * 9);

  const value = bmi(profile);
  if (value < 18.5 && profile.goal === "lose_fat") {
    notes.push("Tu índice de masa corporal ya es bajo: conviene hablar con un profesional de la salud antes de buscar bajar de peso.");
  }
  if (goalUsesTargetWeight(profile.goal) === false && profile.targetWeightKg !== null) {
    notes.push("Para este objetivo no hace falta un peso meta; el plan se centra en el rendimiento.");
  }

  return {
    kcal: round5(total),
    proteinG,
    carbsG,
    fatG,
    bmr: bmr(profile),
    tdee: maintenance,
    weeklyChangeKg: Math.round(weeklyChangeKg * 100) / 100,
    waterL: Math.round((profile.weightKg * 0.035 + (trainingDay ? 0.5 : 0)) * 10) / 10,
    notes,
  };
}

/** Consejo breve de qué comer justo después de entrenar, según el objetivo. */
export function postWorkoutTip(goal: FitnessGoal): string {
  switch (goal) {
    case "lose_fat":
      return "En la hora siguiente come proteína magra con verduras y algo de carbohidrato (arroz o papa): te ayuda a conservar el músculo sin pasarte de calorías.";
    case "build_muscle":
      return "En la hora siguiente toma 25 a 40 g de proteína con carbohidrato (yogur con banano, o arroz con pollo): es cuando más aprovecha el músculo.";
    case "endurance":
      return "Repón carbohidrato y líquidos en los primeros 30 a 60 minutos (banano, arroz, avena) y suma proteína para recuperarte.";
    case "tone":
      return "Combina 20 a 30 g de proteína con una porción moderada de carbohidrato: recuperas sin excederte.";
    default:
      return "Come algo con proteína y carbohidrato dentro de la hora siguiente y bebe agua para recuperarte bien.";
  }
}
