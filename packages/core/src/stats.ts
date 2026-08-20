import type { DailyStats, FocusSession, StreakInfo } from "./types.js";

// "A day" = device-local calendar day (not UTC)
export function localDateKey(iso: string): string {
  const d = new Date(iso);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function computeDailyStats(sessions: FocusSession[]): DailyStats[] {
  const byDay = new Map<string, DailyStats>();

  for (const session of sessions) {
    if (session.outcome === null) continue; // still in progress
    const date = localDateKey(session.startedAt);
    const entry = byDay.get(date) ?? {
      date,
      completedSessions: 0,
      failedSessions: 0,
      totalFocusMinutes: 0,
    };

    if (session.outcome === "completed") {
      entry.completedSessions += 1;
      entry.totalFocusMinutes += session.plannedDurationMinutes;
    } else {
      entry.failedSessions += 1;
    }

    byDay.set(date, entry);
  }

  return [...byDay.values()].sort((a, b) => a.date.localeCompare(b.date));
}

export function computeStreak(sessions: FocusSession[]): StreakInfo {
  const completedDays = new Set(
    sessions.filter((s) => s.outcome === "completed").map((s) => localDateKey(s.startedAt))
  );

  if (completedDays.size === 0) {
    return { current: 0, longest: 0 };
  }

  const sortedDays = [...completedDays].sort();

  let longest = 1;
  let running = 1;
  for (let i = 1; i < sortedDays.length; i++) {
    const prev = new Date(sortedDays[i - 1]);
    const curr = new Date(sortedDays[i]);
    const dayDiff = Math.round((curr.getTime() - prev.getTime()) / 86_400_000);
    running = dayDiff === 1 ? running + 1 : 1;
    longest = Math.max(longest, running);
  }

  // Current streak: walk back from today (or the most recent completed day)
  // while consecutive days are present.
  const todayKey = localDateKey(new Date().toISOString());
  const mostRecent = sortedDays[sortedDays.length - 1];
  const daysSinceMostRecent = Math.round(
    (new Date(todayKey).getTime() - new Date(mostRecent).getTime()) / 86_400_000
  );

  let current = 0;
  if (daysSinceMostRecent <= 1) {
    current = 1;
    for (let i = sortedDays.length - 1; i > 0; i--) {
      const prev = new Date(sortedDays[i - 1]);
      const curr = new Date(sortedDays[i]);
      const dayDiff = Math.round((curr.getTime() - prev.getTime()) / 86_400_000);
      if (dayDiff === 1) {
        current += 1;
      } else {
        break;
      }
    }
  }

  return { current, longest };
}
