import { describe, expect, it } from "vitest";
import { computeDailyStats, computeStreak } from "./stats.js";
import type { FocusSession } from "./types.js";

function session(overrides: Partial<FocusSession>): FocusSession {
  return {
    id: "id",
    plannedDurationMinutes: 25,
    startedAt: new Date().toISOString(),
    endedAt: new Date().toISOString(),
    outcome: "completed",
    awardedItemId: null,
    pausedMs: 0,
    ...overrides,
  };
}

describe("computeDailyStats", () => {
  it("groups completed and failed sessions by local day", () => {
    const sessions = [
      session({ startedAt: "2026-01-01T10:00:00.000Z", outcome: "completed", plannedDurationMinutes: 25 }),
      session({ startedAt: "2026-01-01T18:00:00.000Z", outcome: "failed" }),
      session({ startedAt: "2026-01-02T09:00:00.000Z", outcome: "completed", plannedDurationMinutes: 10 }),
    ];

    const stats = computeDailyStats(sessions);
    expect(stats).toEqual([
      { date: "2026-01-01", completedSessions: 1, failedSessions: 1, totalFocusMinutes: 25 },
      { date: "2026-01-02", completedSessions: 1, failedSessions: 0, totalFocusMinutes: 10 },
    ]);
  });

  it("ignores sessions still in progress", () => {
    const sessions = [session({ outcome: null, endedAt: null })];
    expect(computeDailyStats(sessions)).toEqual([]);
  });
});

describe("computeStreak", () => {
  it("returns zero streak with no completed sessions", () => {
    expect(computeStreak([])).toEqual({ current: 0, longest: 0 });
  });

  it("computes longest streak across non-consecutive days", () => {
    const sessions = [
      session({ startedAt: "2026-01-01T00:00:00.000Z" }),
      session({ startedAt: "2026-01-02T00:00:00.000Z" }),
      session({ startedAt: "2026-01-03T00:00:00.000Z" }),
      session({ startedAt: "2026-01-10T00:00:00.000Z" }),
    ];
    expect(computeStreak(sessions).longest).toBe(3);
  });
});
