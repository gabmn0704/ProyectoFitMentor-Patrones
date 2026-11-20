import type { SessionRecord } from "./types";

/**
 * Constancia: racha diaria, meta semanal, retos del día, nivel y medallas.
 * Todo es puro y se calcula desde las sesiones guardadas en el teléfono.
 */

export const DEFAULT_WEEKLY_GOAL = 4;
export const WEEKLY_GOAL_RANGE = { min: 1, max: 7 } as const;

export function clampGoal(value: number): number {
  return Math.min(WEEKLY_GOAL_RANGE.max, Math.max(WEEKLY_GOAL_RANGE.min, Math.round(value)));
}

/** YYYY-MM-DD en hora local. */
export function dayKey(date: Date): string {
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${date.getFullYear()}-${month}-${day}`;
}

/** Lunes (00:00 local) de la semana de `date`. */
export function weekStart(date: Date): Date {
  const start = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  const offset = (start.getDay() + 6) % 7;
  start.setDate(start.getDate() - offset);
  return start;
}

export interface WeekDay {
  key: string;
  label: string;
  active: boolean;
  today: boolean;
  future: boolean;
}

const DAY_LABELS = ["L", "M", "X", "J", "V", "S", "D"];

/** Lunes a domingo de la semana actual, marcando los días con sesión. */
export function weekDays(sessions: SessionRecord[], now = new Date()): WeekDay[] {
  const active = new Set(sessions.map((s) => dayKey(new Date(s.date))));
  const start = weekStart(now);
  const todayKey = dayKey(now);
  return DAY_LABELS.map((label, index) => {
    const date = new Date(start);
    date.setDate(start.getDate() + index);
    const key = dayKey(date);
    return { key, label, active: active.has(key), today: key === todayKey, future: key > todayKey };
  });
}

/** Sesiones hechas en la semana actual (desde el lunes). */
export function sessionsThisWeek(sessions: SessionRecord[], now = new Date()): number {
  const start = weekStart(now).getTime();
  return sessions.filter((s) => new Date(s.date).getTime() >= start).length;
}

export function weeklyGoalProgress(sessions: SessionRecord[], goal: number, now = new Date()) {
  const done = sessionsThisWeek(sessions, now);
  return { done, goal, percent: Math.min(100, Math.round((done / Math.max(1, goal)) * 100)), reached: done >= goal };
}

/* ---------- Retos del día ---------- */

export type ChallengeMetric = "reps" | "sessions" | "accuracy" | "exercises";

export interface Challenge {
  id: string;
  title: string;
  metric: ChallengeMetric;
  target: number;
  xp: number;
}

const CHALLENGE_POOL: Challenge[] = [
  { id: "reps-15", title: "Haz 15 repeticiones hoy", metric: "reps", target: 15, xp: 40 },
  { id: "reps-30", title: "Suma 30 repeticiones", metric: "reps", target: 30, xp: 70 },
  { id: "sessions-1", title: "Completa una sesión", metric: "sessions", target: 1, xp: 30 },
  { id: "sessions-2", title: "Entrena dos veces hoy", metric: "sessions", target: 2, xp: 80 },
  { id: "accuracy-80", title: "Logra 80 % de precisión", metric: "accuracy", target: 80, xp: 60 },
  { id: "accuracy-90", title: "Clava 90 % de precisión", metric: "accuracy", target: 90, xp: 90 },
  { id: "exercises-2", title: "Prueba 2 ejercicios distintos", metric: "exercises", target: 2, xp: 60 },
  { id: "reps-50", title: "Rompe las 50 repeticiones", metric: "reps", target: 50, xp: 100 },
];

function hash(text: string): number {
  let value = 7;
  for (let i = 0; i < text.length; i += 1) value = (value * 31 + text.charCodeAt(i)) >>> 0;
  return value;
}

/** Tres retos distintos por día, iguales para todo el dispositivo ese día. */
export function dailyChallenges(date = new Date()): Challenge[] {
  const base = hash(dayKey(date));
  // El paso 3 es coprimo con 8, así que los tres índices nunca se repiten.
  return [0, 1, 2].map((k) => CHALLENGE_POOL[(base + k * 3) % CHALLENGE_POOL.length]);
}

export function challengeProgress(challenge: Challenge, today: SessionRecord[]) {
  let value = 0;
  if (challenge.metric === "reps") value = today.reduce((sum, s) => sum + s.reps, 0);
  else if (challenge.metric === "sessions") value = today.length;
  else if (challenge.metric === "accuracy") value = today.reduce((max, s) => Math.max(max, s.accuracy), 0);
  else value = new Set(today.map((s) => s.exercise)).size;
  const shown = Math.min(value, challenge.target);
  return { value: shown, done: value >= challenge.target, percent: Math.round((shown / challenge.target) * 100) };
}

export function sessionsOn(sessions: SessionRecord[], date: Date): SessionRecord[] {
  const key = dayKey(date);
  return sessions.filter((s) => dayKey(new Date(s.date)) === key);
}

/* ---------- Nivel ---------- */

const LEVEL_TITLES = ["Novato", "Aprendiz", "Constante", "Atleta", "Fiera", "Máquina", "Leyenda"];

export function totalXp(sessions: SessionRecord[], completed: Record<string, string[]>): number {
  const reps = sessions.reduce((sum, s) => sum + s.reps, 0);
  const challengeXp = Object.values(completed)
    .flat()
    .reduce((sum, id) => sum + (CHALLENGE_POOL.find((c) => c.id === id)?.xp ?? 0), 0);
  return reps + sessions.length * 25 + challengeXp;
}

/** Nivel n empieza en 100·(n-1)² XP: sube rápido al inicio y se vuelve un reto después. */
export function levelFromXp(xp: number) {
  const level = Math.floor(Math.sqrt(Math.max(0, xp) / 100)) + 1;
  const floor = 100 * (level - 1) ** 2;
  const ceil = 100 * level ** 2;
  return {
    level,
    title: LEVEL_TITLES[Math.min(LEVEL_TITLES.length - 1, level - 1)],
    xp,
    toNext: ceil - xp,
    percent: Math.round(((xp - floor) / (ceil - floor)) * 100),
  };
}

/* ---------- Medallas ---------- */

export interface BadgeContext {
  sessions: SessionRecord[];
  streakDays: number;
  challengesDone: number;
}

export interface Badge {
  id: string;
  title: string;
  description: string;
  /** Avance de 0 a 1 hacia desbloquearla. */
  progress: (ctx: BadgeContext) => number;
}

const ratio = (value: number, target: number) => Math.max(0, Math.min(1, value / target));
const reps = (ctx: BadgeContext) => ctx.sessions.reduce((sum, s) => sum + s.reps, 0);

export const BADGES: Badge[] = [
  { id: "first-rep", title: "Primera sesión", description: "Guarda tu primera sesión.", progress: (c) => ratio(c.sessions.length, 1) },
  { id: "streak-3", title: "Tres seguidos", description: "Entrena 3 días seguidos.", progress: (c) => ratio(c.streakDays, 3) },
  { id: "streak-7", title: "Semana de fuego", description: "Llega a una racha de 7 días.", progress: (c) => ratio(c.streakDays, 7) },
  { id: "reps-100", title: "Centenario", description: "Acumula 100 repeticiones.", progress: (c) => ratio(reps(c), 100) },
  { id: "reps-500", title: "Medio millar", description: "Acumula 500 repeticiones.", progress: (c) => ratio(reps(c), 500) },
  {
    id: "precision",
    title: "Ojo de águila",
    description: "Una sesión con 90 % de precisión o más.",
    progress: (c) => ratio(c.sessions.reduce((max, s) => Math.max(max, s.accuracy), 0), 90),
  },
  { id: "sessions-10", title: "Hábito formado", description: "Completa 10 sesiones.", progress: (c) => ratio(c.sessions.length, 10) },
  { id: "challenges-5", title: "Cazaretos", description: "Cumple 5 retos diarios.", progress: (c) => ratio(c.challengesDone, 5) },
];

export function unlockedBadgeIds(ctx: BadgeContext): string[] {
  return BADGES.filter((badge) => badge.progress(ctx) >= 1).map((badge) => badge.id);
}

/* ---------- Frase del día del mentor ---------- */

const MENTOR_QUOTES = [
  "La técnica de hoy es la fuerza de mañana.",
  "No necesitas ganas: necesitas empezar. Las ganas llegan después.",
  "Una repetición limpia vale más que diez a las carreras.",
  "El progreso es de a poquito, pero no se devuelve.",
  "Hoy no tienes que ser el mejor, solo mejor que ayer.",
  "Si te duele la técnica, ajusta. Si te cansa el esfuerzo, sigue.",
  "El descanso también hace parte del entrenamiento.",
  "Constancia le gana al talento cuando el talento no madruga.",
  "Respira, aprieta el abdomen y baja con control.",
  "Tu cuerpo escucha lo que tu cabeza repite. Háblale bonito.",
  "Cada sesión suma, aunque hoy no lo sientas.",
  "No cuentes los días: haz que los días cuenten.",
  "La disciplina es hacerlo cuando no hay ganas y sonreír después.",
  "Tomar agua y dormir bien también son ejercicios.",
  "Primero la forma, luego el peso, al final la velocidad.",
  "Un día malo entrenando sigue siendo mejor que ninguno.",
  "Lo difícil no es entrenar, es volver mañana. Vuelve.",
  "Tus rodillas, tu espalda y tu futuro te lo agradecen.",
  "Avanza sin prisa, pero sin pausa.",
  "Entrenar es la única conversación donde tu cuerpo siempre te responde.",
];

export function quoteOfTheDay(date = new Date(), userId = ""): string {
  return MENTOR_QUOTES[hash(`${dayKey(date)}${userId}`) % MENTOR_QUOTES.length];
}

/** Racha de días seguidos con sesión. Si hoy aún no entrenas, cuenta desde ayer sin romperse. */
export function streakFromSessions(sessions: SessionRecord[], now = new Date()): number {
  const active = new Set(sessions.map((s) => dayKey(new Date(s.date))));
  const cursor = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  if (!active.has(dayKey(cursor))) cursor.setDate(cursor.getDate() - 1);
  let streak = 0;
  while (active.has(dayKey(cursor))) {
    streak += 1;
    cursor.setDate(cursor.getDate() - 1);
  }
  return streak;
}

/** Retos de hoy con su avance, calculados solo desde las sesiones de hoy. */
export function todayChallenges(sessions: SessionRecord[], now = new Date()) {
  const today = sessionsOn(sessions, now);
  return dailyChallenges(now).map((challenge) => ({ challenge, ...challengeProgress(challenge, today) }));
}

/** Medallas con su avance; `unlocked` si el avance llega a 1. */
export function badgeStatus(ctx: BadgeContext) {
  return BADGES.map((badge) => {
    const progress = badge.progress(ctx);
    return { badge, progress, unlocked: progress >= 1 };
  });
}
