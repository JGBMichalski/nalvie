import { localDateKey, type DailyStats } from '@nalvie/core';

const HEATMAP_DAYS = 84; // Rolling 12 weeks, per the Stats screen spec.

export function formatFocusDuration(totalMinutes: number): string {
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  return hours > 0 ? `${hours}h ${minutes}m` : `${minutes}m`;
}

export function heatmapIntensity(completedSessions: number): 0 | 1 | 2 | 3 {
  return Math.min(3, Math.max(0, completedSessions)) as 0 | 1 | 2 | 3;
}

export interface HeatmapDay {
  date: string; // YYYY-MM-DD
  completedSessions: number;
}

/** The last `totalDays` local-calendar days ending today, oldest first. */
export function buildHeatmapDays(
  dailyStats: DailyStats[],
  now: Date = new Date(),
  totalDays: number = HEATMAP_DAYS,
): HeatmapDay[] {
  const byDate = new Map(dailyStats.map((stats) => [stats.date, stats]));
  const days: HeatmapDay[] = [];

  for (let offset = totalDays - 1; offset >= 0; offset--) {
    const date = new Date(now);
    date.setDate(date.getDate() - offset);
    const key = localDateKey(date.toISOString());
    days.push({ date: key, completedSessions: byDate.get(key)?.completedSessions ?? 0 });
  }

  return days;
}

/** "At risk today": a streak is active but nothing has completed yet today. */
export function isStreakAtRisk(currentStreak: number, dailyStats: DailyStats[], now: Date = new Date()): boolean {
  if (currentStreak <= 0) return false;
  const today = dailyStats.find((stats) => stats.date === localDateKey(now.toISOString()));
  return (today?.completedSessions ?? 0) === 0;
}
