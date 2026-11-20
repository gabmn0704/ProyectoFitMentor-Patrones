import type { Achievement, CoachSource, Level, User } from "./types";
import { exerciseLabel } from "./exercises";

/**
 * Traducción entre el contrato del backend (enums en inglés) y la interfaz
 * en español. El front nunca envía etiquetas: siempre los valores del enum.
 */

export const LEVELS: readonly Level[] = ["BEGINNER", "INTERMEDIATE", "ADVANCED"];

/** Límites de entrada que valida el backend (Bean Validation). */
export const LIMITS = {
  /** POST /api/auth/guest `name` y PATCH /api/me `name`. */
  userName: 120,
  /** PATCH /api/me `goal`. */
  goal: 60,
  /** POST /api/coach `question`. */
  coachQuestion: 500,
  /** POST /api/coach `context`. */
  coachContext: 4000,
} as const;

const LEVEL_LABEL: Record<Level, string> = {
  BEGINNER: "Principiante",
  INTERMEDIATE: "Intermedio",
  ADVANCED: "Avanzado",
};

/** Valores antiguos que pudieran quedar guardados en localStorage. */
const LEGACY_LEVELS: Record<string, Level> = {
  principiante: "BEGINNER",
  intermedio: "INTERMEDIATE",
  avanzado: "ADVANCED",
};

export function isLevel(value: unknown): value is Level {
  return typeof value === "string" && (LEVELS as readonly string[]).includes(value);
}

/** Normaliza cualquier nivel recibido al enum del backend; desconocido cae en BEGINNER. */
export function toLevel(value: unknown): Level {
  if (typeof value !== "string") return "BEGINNER";
  const upper = value.trim().toUpperCase();
  if (isLevel(upper)) return upper;
  return LEGACY_LEVELS[value.trim().toLowerCase()] ?? "BEGINNER";
}

export function levelLabel(value: unknown): string {
  return LEVEL_LABEL[toLevel(value)];
}

/** Objetivo: texto libre en el backend (máx. 255). Guardamos claves estables. */
export const GOALS = [
  { value: "strength", label: "Ganar fuerza" },
  { value: "mobility", label: "Movilidad" },
  { value: "endurance", label: "Resistencia" },
  { value: "toning", label: "Tonificar" },
] as const;

const LEGACY_GOALS: Record<string, string> = {
  fuerza: "strength",
  movilidad: "mobility",
  resistencia: "endurance",
  tonificar: "toning",
};

export function toGoal(value: string | null | undefined): string {
  if (!value) return "";
  return LEGACY_GOALS[value] ?? value;
}

export function goalLabel(value: string | null | undefined): string {
  const key = toGoal(value);
  return GOALS.find((goal) => goal.value === key)?.label ?? key;
}

/**
 * Invitado: usa el campo `guest` del backend. Si no llega, se deduce del
 * correo, que es nulo o sintético (dominio reservado) en cuentas de invitado.
 */
export function isGuest(user: Pick<User, "email" | "guest"> | null | undefined): boolean {
  if (typeof user?.guest === "boolean") return user.guest;
  const email = user?.email?.trim().toLowerCase();
  if (!email) return true;
  const domain = email.split("@")[1] ?? "";
  return /(^|\.)guest(\.|$)/.test(domain) || /\.(local|invalid|example|test)$/.test(domain) || email.startsWith("guest");
}

/** Normaliza el usuario recibido del backend (o guardado por versiones previas). */
export function normalizeUser(raw: User): User {
  return {
    ...raw,
    level: toLevel(raw.level),
    ...(raw.goal ? { goal: toGoal(raw.goal) } : {}),
  };
}

/** El backend envía progress entero 0-100. */
export function progressPercent(achievement: Pick<Achievement, "progress" | "unlocked">): number {
  if (achievement.unlocked) return 100;
  const value = Number(achievement.progress);
  if (!Number.isFinite(value)) return 0;
  return Math.min(100, Math.max(0, Math.round(value)));
}

const ACHIEVEMENT_TEXT: Record<string, { title: string; description: string }> = {
  "first-session": { title: "Primer paso", description: "Completa tu primera sesión de entrenamiento." },
  "reps-100": { title: "Centenario", description: "Alcanza 100 repeticiones en total." },
  "streak-3": { title: "Tres seguidos", description: "Entrena tres días consecutivos." },
  "accuracy-90": { title: "Precisión", description: "Mantén una precisión media del 90 % o más (mínimo 3 sesiones)." },
  "calories-500": { title: "Quemador", description: "Quema 500 calorías estimadas." },
  "all-exercises": { title: "Completo", description: "Entrena todos los ejercicios del catálogo." },
};

export function achievementText(achievement: Pick<Achievement, "id" | "title" | "description">): {
  title: string;
  description: string;
} {
  return ACHIEVEMENT_TEXT[achievement.id] ?? { title: achievement.title, description: achievement.description };
}

/** Notas de la rutina adaptativa (el backend las genera en inglés). */
export function routineNote(note: string): string {
  const focus = /^Focus on form: recent accuracy ([\d.]+)%\.?$/i.exec(note.trim());
  if (focus) return `Cuida la técnica: tu precisión reciente es ${focus[1]} %.`;
  if (/^Keep the movement controlled\.?$/i.test(note.trim())) return "Mantén el movimiento controlado.";
  return note;
}

export function routineReason(reason: string, level: unknown): string {
  const label = levelLabel(level).toLowerCase();
  const weak = /^Routine for \w+ level\. (.+) come first because recent accuracy is low\.?$/i.exec(reason.trim());
  if (weak) {
    const list = weak[1]!
      .split(/,\s*/)
      .map((id) => exerciseLabel(id).toLowerCase())
      .join(", ");
    return `Rutina de nivel ${label}. Primero ${list}, porque tu precisión reciente es baja.`;
  }
  if (/^Routine for \w+ level, balanced/i.test(reason.trim())) {
    return `Rutina de nivel ${label}, equilibrada entre los ejercicios de tu nivel.`;
  }
  return reason;
}

const COACH_SOURCE: Record<CoachSource, string> = {
  claude: "Coach IA",
  rules: "Guía de técnica",
};

/** Normaliza `source` del coach: el backend envía "claude" o "rules". */
export function toCoachSource(value: unknown): CoachSource {
  return value === "claude" ? "claude" : "rules";
}

export function coachSourceLabel(source: string | undefined): string | undefined {
  if (source !== "claude" && source !== "rules") return undefined;
  return COACH_SOURCE[source];
}

const SERVER_STATE: Record<string, string> = {
  WARMUP: "Calentamiento",
  ACTIVE_SET: "Serie activa",
  REST: "Descanso",
  FINISHED: "Finalizada",
  PAUSED: "En pausa",
};

export function serverStateLabel(state: string | null | undefined): string | undefined {
  return state ? SERVER_STATE[state] ?? state : undefined;
}
