import type { CoachProfilePayload } from "./coachProfile";

/** Minúsculas, sin tildes ni espacios sobrantes (mismo criterio que la web). */
export function normalizeText(text: string): string {
  return text
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .trim();
}

/**
 * Respuesta de respaldo del coach cuando el servidor no responde (sin red, caído o sin la IA).
 * Cubre las intenciones más comunes; el servidor sigue siendo la fuente principal.
 */

interface Rule {
  stems: string[];
  answer: string;
}

const PAIN_STEMS = ["dol", "duel", "lesion", "lastim", "mareo", "molesti", "pinchazo", "esguince"];
const PAIN_ANSWER =
  "Si sientes dolor, detente y consulta a un profesional de la salud antes de continuar. No fuerces el movimiento ni entrenes esa zona hasta que te valoren.";

const RULES: Rule[] = [
  {
    stems: ["hola", "buenas", "buenos dias", "hey", "quien eres", "que tal"],
    answer: "¡Hola! Soy el coach de técnica de FitMentor. Pregúntame por tu postura, una rutina, tus descansos o tu progresión.",
  },
  { stems: ["gracias", "genial", "perfecto"], answer: "¡De nada! Aquí sigo para lo que necesites." },
  {
    stems: ["rutina", "plan de entren", "que entreno", "15 min", "10 min", "20 min"],
    answer:
      "Rutina corta de 15 minutos: 2 de calentamiento y 3 rondas de 10 sentadillas, 8 flexiones, 8 zancadas por pierna y 30 s de plancha, con 30 s de pausa entre rondas.",
  },
  {
    stems: ["calent", "calient", "estir", "movilidad"],
    answer:
      "Calienta de 5 a 8 minutos: movilidad de cadera, hombros y tobillos, cardio suave y una serie ligera del ejercicio. Los estiramientos largos, al final.",
  },
  {
    stems: ["proteina", "comer", "dieta", "nutri", "calori", "creatina", "suplement"],
    answer:
      "Orientación general, no es consejo médico: reparte la proteína en las comidas (suele recomendarse de 1,6 a 2,2 g por kg a quien entrena), suma verduras y carbohidratos de calidad e hidrátate. Para una dieta concreta, consulta a un profesional.",
  },
  {
    stems: ["descans", "recuper", "dormi", "agujet", "por semana", "cada cuanto", "entre series"],
    answer: "Descansa de 60 a 90 s entre series y deja 48 horas entre sesiones del mismo grupo muscular. Dormir 7 a 9 horas acelera tu recuperación.",
  },
  {
    stems: ["rodilla"],
    answer: "Para cuidar las rodillas, dirígelas en la misma dirección que los pies y no dejes que colapsen hacia dentro al bajar.",
  },
  {
    stems: ["espalda", "lumbar"],
    answer: "Para proteger la espalda mantén el abdomen activo y el torso estable durante todo el movimiento.",
  },
  {
    stems: ["profund", "sentadilla"],
    answer: "En la sentadilla mantén el pecho erguido, las rodillas alineadas con los pies y los talones apoyados. Baja solo hasta donde controles la técnica.",
  },
  {
    stems: ["flexion", "push"],
    answer: "En la flexión mantén el cuerpo en línea recta de cabeza a talones y los codos a unos 45 grados del torso.",
  },
  { stems: ["plancha"], answer: "En la plancha contrae abdomen y glúteos para que la cadera no caiga ni suba." },
  {
    stems: ["peso", "grasa", "adelgaz", "quemar"],
    answer:
      "Orientación general: bajar grasa depende sobre todo de un pequeño déficit de calorías sostenido, proteína suficiente, buen sueño y fuerza 3 o 4 veces por semana.",
  },
  {
    stems: ["musculo", "masa", "hipertrofia", "fuerza"],
    answer:
      "Para ganar músculo: cada grupo 2 veces por semana, de 6 a 12 repeticiones cerca del fallo técnico, progresión gradual, proteína suficiente y 7 a 9 horas de sueño.",
  },
  {
    stems: ["motiv", "cansad", "pereza", "desanim", "no puedo"],
    answer: "Es normal sentirse así: diez repeticiones bien hechas valen más que veinte malas. Respira y termina con una serie corta de buena forma.",
  },
];

const FALLBACK =
  "Ahora mismo no logro conectar con el coach en línea, pero en cualquier ejercicio funciona lo mismo: técnica controlada, respiración constante y descanso suficiente. Prueba de nuevo en un momento o pregúntame por una rutina, el calentamiento, descansos o nutrición.";

function mentions(text: string, stems: string[]): boolean {
  return stems.some((stem) => new RegExp(`(?<![a-z])${stem}`).test(text));
}

const NUTRITION_STEMS = ["proteina", "comer", "dieta", "nutri", "calori", "cenar", "ceno", "desayun", "almuerzo", "peso", "grasa"];

export function localCoachAnswer(question: string, profile?: CoachProfilePayload): string {
  const text = normalizeText(question);
  if (mentions(text, PAIN_STEMS)) return PAIN_ANSWER;
  const answer = RULES.find((rule) => mentions(text, rule.stems))?.answer ?? FALLBACK;
  // Con perfil, las preguntas de alimentación abren con las metas de la persona.
  if (profile && mentions(text, NUTRITION_STEMS)) {
    return `Según tu plan, apunta a unas ${profile.kcal} kcal y unos ${profile.proteinG} g de proteína al día. ${answer}`;
  }
  return answer;
}
