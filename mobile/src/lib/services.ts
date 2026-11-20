import { apiRequest } from "./api";
import { LIMITS } from "./contract";
import type { CoachProfilePayload } from "./coachProfile";
import type {
  Achievement,
  AuthResponse,
  CoachAnswer,
  ExerciseInfo,
  Level,
  NextExercise,
  Routine,
  ServerSession,
  SessionPayload,
  Stats,
  User,
} from "./types";

export interface ProfilePatch {
  name?: string;
  level?: Level;
  goal?: string | null;
}

/** Llamadas tipadas al backend. Todas las rutas protegidas reciben el Bearer token. */

export const authApi = {
  google: (credential: string) =>
    apiRequest<AuthResponse>("/api/auth/google", { method: "POST", body: { credential } }),
  register: (name: string, email: string, password: string) =>
    apiRequest<AuthResponse>("/api/auth/register", { method: "POST", body: { name, email, password } }),
  login: (email: string, password: string) =>
    apiRequest<AuthResponse>("/api/auth/login", { method: "POST", body: { email, password } }),
  /** Nombre opcional, máx. 120 caracteres en el backend. */
  guest: (name?: string) => {
    const trimmed = name?.trim().slice(0, LIMITS.userName);
    return apiRequest<AuthResponse>("/api/auth/guest", {
      method: "POST",
      body: trimmed ? { name: trimmed } : {},
    });
  },
};

export const meApi = {
  get: (token: string) => apiRequest<User>("/api/me", { token }),
  update: (token: string, patch: ProfilePatch) =>
    apiRequest<User>("/api/me", { method: "PATCH", body: patch, token }),
};

export const sessionsApi = {
  create: (token: string, payload: SessionPayload) =>
    apiRequest<ServerSession>("/api/sessions", { method: "POST", body: payload, token }),
  /** El backend acepta limit entre 1 y 100. */
  list: (token: string, limit = 20) =>
    apiRequest<ServerSession[]>(`/api/sessions?limit=${Math.min(100, Math.max(1, Math.round(limit)))}`, { token }),
};

export const statsApi = {
  get: (token: string) => apiRequest<Stats>("/api/stats", { token }),
};

export const routineApi = {
  get: (token: string) => apiRequest<Routine>("/api/routine", { token }),
};

export const achievementsApi = {
  list: (token: string) => apiRequest<Achievement[]>("/api/achievements", { token }),
};

export const exercisesApi = {
  /** Búsqueda remota con caché LRU; el filtrado fino se hace con el Trie en cliente. */
  search: (token: string, query = "") =>
    apiRequest<ExerciseInfo[]>(`/api/exercises?q=${encodeURIComponent(query)}`, { token }),
  /** Progresiones desde un ejercicio (array con `distance`). */
  next: (token: string, from: string) =>
    apiRequest<NextExercise[]>(`/api/exercises/next?from=${encodeURIComponent(from)}`, { token }),
};

/** Datos opcionales que acompañan la pregunta para que la respuesta sea personal. */
export interface CoachChat {
  profile?: CoachProfilePayload;
  history?: Array<{ role: "user" | "coach"; text: string }>;
}

export const coachApi = {
  /**
   * El backend acepta la pregunta hasta 500 caracteres y `context` hasta 4000.
   * Se recortan aquí para no provocar un 400 por un texto pegado demasiado largo.
   */
  ask: (token: string, question: string, chat: CoachChat = {}) => {
    const q = question.trim().slice(0, LIMITS.coachQuestion);
    const history = chat.history?.slice(-6).map((turn) => ({ role: turn.role, text: turn.text.slice(0, 400) }));
    return apiRequest<CoachAnswer>("/api/coach", {
      method: "POST",
      body: {
        question: q,
        ...(chat.profile ? { profile: chat.profile } : {}),
        ...(history && history.length ? { history } : {}),
      },
      token,
    });
  },
};
