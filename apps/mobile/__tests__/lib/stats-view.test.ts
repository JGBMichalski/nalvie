import type { DailyStats } from '@nalvie/core';

import {
  buildHeatmapDays,
  formatFocusDuration,
  heatmapIntensity,
  isStreakAtRisk,
} from '../../lib/stats-view';

function daily(date: string, overrides: Partial<DailyStats> = {}): DailyStats {
  return { date, completedSessions: 0, failedSessions: 0, totalFocusMinutes: 0, ...overrides };
}

describe('formatFocusDuration', () => {
  it('formats minutes only when under an hour', () => {
    expect(formatFocusDuration(45)).toBe('45m');
  });

  it('drops the hours segment when zero, even for 0 minutes total', () => {
    expect(formatFocusDuration(0)).toBe('0m');
  });

  it('includes both hours and minutes once an hour has passed', () => {
    expect(formatFocusDuration(125)).toBe('2h 5m');
  });

  it('shows 0 minutes rather than omitting them for an exact hour', () => {
    expect(formatFocusDuration(120)).toBe('2h 0m');
  });
});

describe('heatmapIntensity', () => {
  it('maps zero completed sessions to intensity 0', () => {
    expect(heatmapIntensity(0)).toBe(0);
  });

  it('maps one completed session to intensity 1', () => {
    expect(heatmapIntensity(1)).toBe(1);
  });

  it('maps two completed sessions to intensity 2', () => {
    expect(heatmapIntensity(2)).toBe(2);
  });

  it('caps intensity at 3 for three or more completed sessions', () => {
    expect(heatmapIntensity(3)).toBe(3);
    expect(heatmapIntensity(9)).toBe(3);
  });
});

describe('buildHeatmapDays', () => {
  it('returns 84 days ending today, oldest first', () => {
    const now = new Date('2026-03-15T12:00:00.000Z');
    const days = buildHeatmapDays([], now);

    expect(days).toHaveLength(84);
    expect(days[0].date).toBe('2025-12-22');
    expect(days[83].date).toBe('2026-03-15');
  });

  it('fills in completedSessions from matching daily stats, zero otherwise', () => {
    const now = new Date('2026-03-15T12:00:00.000Z');
    const days = buildHeatmapDays([daily('2026-03-15', { completedSessions: 2 })], now);

    expect(days[83]).toEqual({ date: '2026-03-15', completedSessions: 2 });
    expect(days[82]).toEqual({ date: '2026-03-14', completedSessions: 0 });
  });
});

describe('isStreakAtRisk', () => {
  const now = new Date('2026-03-15T12:00:00.000Z');

  it('is false when there is no current streak', () => {
    expect(isStreakAtRisk(0, [], now)).toBe(false);
  });

  it('is true when a streak is active but nothing has completed today yet', () => {
    const dailyStats = [daily('2026-03-14', { completedSessions: 1 })];
    expect(isStreakAtRisk(3, dailyStats, now)).toBe(true);
  });

  it('is false once a session has completed today', () => {
    const dailyStats = [daily('2026-03-15', { completedSessions: 1 })];
    expect(isStreakAtRisk(3, dailyStats, now)).toBe(false);
  });

  it('is true when today has a daily-stats entry but zero completions (e.g. only failures)', () => {
    const dailyStats = [daily('2026-03-15', { completedSessions: 0, failedSessions: 1 })];
    expect(isStreakAtRisk(3, dailyStats, now)).toBe(true);
  });
});
