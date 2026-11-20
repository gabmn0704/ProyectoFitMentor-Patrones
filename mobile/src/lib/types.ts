export type ExerciseId = "squat" | "push_up" | "plank" | "deadlift" | "lunge";

export type Point = { x: number; y: number; visibility?: number };

/** Niveles del backend (enum). La interfaz muestra etiquetas en español. */
export type Level = "BEGINNER" | "INTERMEDIATE" | "ADVANCED";

/** Forma pública del usuario. `picture` y `goal` llegan nulos cuando no hay valor. */
export interface User {
  id: string;
  name: string;
  /** Nulo o sintético para invitados. */
  email?: string | null;
  picture?: string | null;
  level: Level;
  goal?: string | null;
  /** Verdadero para cuentas de invitado (el backend lo envía). */
  guest?: boolean;
  createdAt?: string;
}

export interface AuthResponse {
  token: string;
  user: User;
}

export interface WeeklyPoint {
  date: string;
  reps: number;
  accuracy: number;
}

export interface ExerciseStat {
  exercise: string;
  reps: number;
  accuracy: number;
}

export interface Stats {
  totalSessions: number;
  totalReps: number;
  totalCalories: number;
  avgAccuracy: number;
  streakDays: number;
  weekly: WeeklyPoint[];
  byExercise: ExerciseStat[];
  /** Solo lo envía el backend; las estadísticas locales no lo conocen. */
  level?: Level;
}

export interface RoutineItem {
  exercise: string;
  sets: number;
  reps: number;
  note: string;
}

export interface Routine {
  level: Level;
  restSeconds: number;
  items: RoutineItem[];
  reason: string;
}

export interface Achievement {
  id: string;
  title: string;
  description: string;
  unlocked: boolean;
  /** Avance hacia la meta: entero de 0 a 100. */
  progress: number;
}

export interface ExerciseInfo {
  id: string;
  label: string;
  muscle: string;
  difficulty: Level;
}

/** GET /api/exercises/next: siguientes pasos ordenados por distancia en el grafo. */
export interface NextExercise extends ExerciseInfo {
  distance: number;
}

export interface SessionPayload {
  exercise: ExerciseId;
  reps: number;
  accuracy: number;
  durationSeconds: number;
  avgAngles?: Record<string, number>;
}

/** Sesión tal como la devuelve el backend (POST y GET /api/sessions). */
export interface ServerSession {
  id: string;
  userId: string;
  exercise: string;
  reps: number;
  accuracy: number;
  calories: number;
  durationSeconds: number;
  /** ISO 8601. */
  createdAt: string;
}

export interface SessionRecord extends SessionPayload {
  /** Identificador local único (uuid o timestamp). */
  localId: string;
  /** ISO 8601. */
  date: string;
  synced: boolean;
}

/** "claude": respuesta del modelo; "rules": guía de técnica basada en reglas (sin clave o IA caída). */
export type CoachSource = "claude" | "rules";

export interface CoachAnswer {
  answer: string;
  source: CoachSource;
}

export interface FeedbackMessage {
  type: "feedback";
  score: number;
  message: string;
  feedback: string[];
  /**
   * Fase de la IA ("ready" | "up" | "down" | "bottom" | "hold"). Ausente cuando
   * la IA no respondió: entonces el backend no avanza las repeticiones.
   */
  phase?: string;
  /** Repeticiones acumuladas de la sesión según el servidor. */
  reps?: number;
  /** WARMUP | ACTIVE_SET | REST | FINISHED | PAUSED */
  state?: string;
  exercise?: string;
}

export interface StateMessage {
  type: "state";
  /** WARMUP | ACTIVE_SET | REST | FINISHED | PAUSED */
  state: string;
  /** Ejercicio actual de la rutina del servidor, si lo hay. */
  exercise?: string;
}

export interface ErrorMessage {
  type: "error";
  message: string;
}

export type ServerMessage = FeedbackMessage | StateMessage | ErrorMessage;

export type CommandName = "pause" | "resume" | "skip" | "finish" | "undo";
