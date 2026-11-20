/** Estados de "Rep", la mascota de FitMentor, y sus frases: tono claro, cercano y profesional. */
export type MascotState = "idle" | "wave" | "cheer" | "count" | "rest" | "celebrate" | "worried";

export const MASCOT_STATES: MascotState[] = ["idle", "wave", "cheer", "count", "rest", "celebrate", "worried"];

export const MASCOT_NAME = "Rep";

export const MASCOT_PHRASES: Record<MascotState, string[]> = {
  idle: [
    "Cuando quieras, empezamos.",
    "Hoy es un buen día para moverse.",
    "Yo llevo la cuenta; tú cuida la técnica.",
    "Un poco cada día construye mucho.",
  ],
  wave: [
    "Hola, qué bueno verte de nuevo.",
    "Bienvenido. Tu entrenamiento te espera.",
    "Hola. Vamos a entrenar con buena técnica.",
    "Te estaba esperando. ¿Empezamos?",
  ],
  cheer: [
    "Muy bien, mantén ese ritmo.",
    "Así se hace: control y constancia.",
    "Excelente técnica. Sigue así.",
    "Vas muy bien. Una serie más.",
  ],
  count: [
    "Yo cuento; tú concéntrate en la forma.",
    "Una más, con control.",
    "Baja despacio, sube con fuerza.",
    "Repetición limpia, repetición que cuenta.",
  ],
  rest: [
    "Respira profundo e hidrátate.",
    "Descansa: el músculo también crece ahora.",
    "Toma agua y suelta los hombros.",
    "Recupera el aliento. Ya casi seguimos.",
  ],
  celebrate: [
    "Lo lograste. Gran sesión.",
    "Nuevo logro desbloqueado. Bien hecho.",
    "Excelente trabajo. Ese progreso es tuyo.",
    "Sesión completa. Te lo ganaste.",
  ],
  worried: [
    "Un mal día no borra tu progreso.",
    "Tranquilo: mañana lo haremos mejor.",
    "Empecemos suave y con buena técnica.",
    "Aquí estoy. Vamos paso a paso.",
  ],
};

/** Elige una frase del estado; con `seed` es determinista (útil para pruebas y para "frase del día"). */
export function mascotPhrase(state: MascotState, seed?: number): string {
  const list = MASCOT_PHRASES[state];
  const index = seed === undefined ? Math.floor(Math.random() * list.length) : Math.abs(Math.floor(seed)) % list.length;
  return list[index];
}

export const MASCOT_LABELS: Record<MascotState, string> = {
  idle: "en calma",
  wave: "saludando",
  cheer: "animando",
  count: "contando repeticiones",
  rest: "descansando",
  celebrate: "celebrando",
  worried: "preocupado",
};
