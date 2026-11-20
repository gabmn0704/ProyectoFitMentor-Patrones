import type { SessionRecord, Stats, WeeklyPoint } from "./types";

export const WEEKLY_GOAL_REPS = 120;

const DAY_MS = 24 * 60 * 60 * 1000;

/** Clave YYYY-MM-DD en hora local (evita desfases de UTC). */
function dayKey(date: Date): string {
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${date.getFullYear()}-${month}-${day}`;
}

/**
 * Calcula estadísticas a partir de sesiones locales. Sirve en modo offline y
 * como respaldo cuando el backend no responde.
 */
export function computeLocalStats(sessions: SessionRecord[], now = new Date()): Stats {
  const totalReps = sessions.reduce((sum, s) => sum + s.reps, 0);
  const avgAccuracy = sessions.length
    ? Math.round(sessions.reduce((sum, s) => sum + s.accuracy, 0) / sessions.length)
    : 0;

  const weekly: WeeklyPoint[] = [];
  for (let offset = 6; offset >= 0; offset--) {
    const day = new Date(now.getTime() - offset * DAY_MS);
    const key = dayKey(day);
    const inDay = sessions.filter((s) => dayKey(new Date(s.date)) === key);
    weekly.push({
      date: key,
      reps: inDay.reduce((sum, s) => sum + s.reps, 0),
      accuracy: inDay.length ? Math.round(inDay.reduce((sum, s) => sum + s.accuracy, 0) / inDay.length) : 0,
    });
  }

  const byExerciseMap = new Map<string, { reps: number; accuracy: number; count: number }>();
  for (const s of sessions) {
    const entry = byExerciseMap.get(s.exercise) ?? { reps: 0, accuracy: 0, count: 0 };
    entry.reps += s.reps;
    entry.accuracy += s.accuracy;
    entry.count += 1;
    byExerciseMap.set(s.exercise, entry);
  }
  const byExercise = [...byExerciseMap.entries()].map(([exercise, e]) => ({
    exercise,
    reps: e.reps,
    accuracy: Math.round(e.accuracy / e.count),
  }));

  const activeDays = new Set(sessions.map((s) => dayKey(new Date(s.date))));
  let streakDays = 0;
  for (let cursor = now; activeDays.has(dayKey(cursor)); cursor = new Date(cursor.getTime() - DAY_MS)) {
    streakDays++;
  }

  return {
    totalSessions: sessions.length,
    totalReps,
    totalCalories: Math.round(totalReps * 0.4),
    avgAccuracy,
    streakDays,
    weekly,
    byExercise,
  };
}

/** Repeticiones de los últimos siete días frente a la meta semanal. */
export function weeklyProgress(stats: Stats): { reps: number; percent: number } {
  const reps = stats.weekly.reduce((sum, day) => sum + day.reps, 0);
  return { reps, percent: Math.min(100, Math.round((reps / WEEKLY_GOAL_REPS) * 100)) };
}
