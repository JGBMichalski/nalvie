import { describe, expect, it, vi } from "vitest";
import { elapsedMs, finalizeInterruptedSession, isSessionComplete } from "./session.js";
import type { SessionRepository } from "./repository.js";
import type { FocusSession } from "./types.js";

describe("session", () => {
  it("computes elapsed time from start timestamp", () => {
    const startedAt = new Date("2026-01-01T00:00:00.000Z").toISOString();
    const now = new Date("2026-01-01T00:00:05.000Z");
    expect(elapsedMs({ startedAt, pausedMs: 0 }, now)).toBe(5000);
  });

  it("subtracts paused time from elapsed time", () => {
    const startedAt = new Date("2026-01-01T00:00:00.000Z").toISOString();
    const now = new Date("2026-01-01T00:00:10.000Z");
    expect(elapsedMs({ startedAt, pausedMs: 4000 }, now)).toBe(6000);
  });

  it("is not complete before the planned duration elapses", () => {
    const startedAt = new Date("2026-01-01T00:00:00.000Z").toISOString();
    const now = new Date("2026-01-01T00:09:00.000Z");
    expect(isSessionComplete({ startedAt, plannedDurationMinutes: 10, pausedMs: 0 }, now)).toBe(false);
  });

  it("is complete once the planned duration elapses", () => {
    const startedAt = new Date("2026-01-01T00:00:00.000Z").toISOString();
    const now = new Date("2026-01-01T00:10:00.000Z");
    expect(isSessionComplete({ startedAt, plannedDurationMinutes: 10, pausedMs: 0 }, now)).toBe(true);
  });

  describe("finalizeInterruptedSession", () => {
    function makeRepo(inProgress: FocusSession | null): SessionRepository {
      return {
        saveSession: vi.fn(),
        getSession: vi.fn(),
        listSessions: vi.fn(),
        getInProgressSession: vi.fn().mockResolvedValue(inProgress),
        saveTankItem: vi.fn(),
        listTankItems: vi.fn(),
      };
    }

    it("does nothing when no session was left in progress", async () => {
      const repo = makeRepo(null);
      await finalizeInterruptedSession(repo);
      expect(repo.saveSession).not.toHaveBeenCalled();
    });

    it("marks an in-progress session as failed", async () => {
      const inProgress: FocusSession = {
        id: "abc",
        plannedDurationMinutes: 25,
        startedAt: new Date("2026-01-01T00:00:00.000Z").toISOString(),
        endedAt: null,
        outcome: null,
        awardedItemId: null,
        pausedMs: 0,
      };
      const repo = makeRepo(inProgress);
      const now = new Date("2026-01-01T00:05:00.000Z");
      await finalizeInterruptedSession(repo, now);

      expect(repo.saveSession).toHaveBeenCalledWith({
        ...inProgress,
        endedAt: now.toISOString(),
        outcome: "failed",
      });
    });
  });
});
