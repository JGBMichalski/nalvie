import { describe, expect, it, vi } from "vitest";
import {
  MAX_PAUSE_MS,
  applyPause,
  completeSession,
  completesAt,
  createSession,
  elapsedMs,
  failSession,
  finalizeInterruptedSession,
  growthStage,
  hasUsedPause,
  isSessionComplete,
  sessionProgress,
} from "./session.js";
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

  describe("completesAt", () => {
    it("is startedAt + plannedDurationMinutes when there's no credited pause", () => {
      const startedAt = new Date("2026-01-01T00:00:00.000Z").toISOString();
      expect(completesAt({ startedAt, plannedDurationMinutes: 10, pausedMs: 0 })).toBe(
        new Date("2026-01-01T00:10:00.000Z").getTime(),
      );
    });

    it("pushes the instant back by any credited pause time", () => {
      const startedAt = new Date("2026-01-01T00:00:00.000Z").toISOString();
      expect(completesAt({ startedAt, plannedDurationMinutes: 10, pausedMs: 5_000 })).toBe(
        new Date("2026-01-01T00:10:05.000Z").getTime(),
      );
    });
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
        clearTankItems: vi.fn(),
        saveUnlockedSpecies: vi.fn(),
        listUnlockedSpecies: vi.fn(),
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
        selectedItemId: "clownfish",
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

  describe("createSession", () => {
    it("creates an in-progress session with no outcome yet", () => {
      const now = new Date("2026-01-01T00:00:00.000Z");
      expect(createSession("s1", 25, "clownfish", now)).toEqual({
        id: "s1",
        plannedDurationMinutes: 25,
        startedAt: now.toISOString(),
        endedAt: null,
        outcome: null,
        selectedItemId: "clownfish",
        awardedItemId: null,
        pausedMs: 0,
      });
    });
  });

  describe("hasUsedPause", () => {
    it("is false when no pause time has been recorded", () => {
      expect(hasUsedPause({ pausedMs: 0 })).toBe(false);
    });

    it("is true once any pause time has been recorded", () => {
      expect(hasUsedPause({ pausedMs: 1 })).toBe(true);
    });
  });

  describe("applyPause", () => {
    const base: FocusSession = {
      id: "s1",
      plannedDurationMinutes: 25,
      startedAt: new Date("2026-01-01T00:00:00.000Z").toISOString(),
      endedAt: null,
      outcome: null,
      selectedItemId: "clownfish",
      awardedItemId: null,
      pausedMs: 0,
    };

    it("adds the pause duration to pausedMs", () => {
      expect(applyPause(base, 5_000).pausedMs).toBe(5_000);
    });

    it("caps the added pause duration at MAX_PAUSE_MS", () => {
      expect(applyPause(base, MAX_PAUSE_MS + 60_000).pausedMs).toBe(MAX_PAUSE_MS);
    });

    it("is a no-op once a pause has already been used (single use per session)", () => {
      const alreadyPaused = { ...base, pausedMs: 10_000 };
      expect(applyPause(alreadyPaused, 5_000).pausedMs).toBe(10_000);
    });

    it("always registers as used, even for a near-instant pause/resume", () => {
      // pausedMs > 0 is what hasUsedPause checks — a 0ms-duration pause must
      // still count as "used", or the single-use guard could be bypassed.
      const result = applyPause(base, 0);
      expect(hasUsedPause(result)).toBe(true);
    });
  });

  describe("completeSession", () => {
    it("marks the session completed, awarding the item selected when the session started", () => {
      const base: FocusSession = {
        id: "s1",
        plannedDurationMinutes: 25,
        startedAt: new Date("2026-01-01T00:00:00.000Z").toISOString(),
        endedAt: null,
        outcome: null,
        selectedItemId: "clownfish",
        awardedItemId: null,
        pausedMs: 0,
      };
      const now = new Date("2026-01-01T00:25:00.000Z");
      expect(completeSession(base, now)).toEqual({
        ...base,
        endedAt: now.toISOString(),
        outcome: "completed",
        awardedItemId: "clownfish",
      });
    });
  });

  describe("failSession", () => {
    it("marks the session failed with no awarded item", () => {
      const base: FocusSession = {
        id: "s1",
        plannedDurationMinutes: 25,
        startedAt: new Date("2026-01-01T00:00:00.000Z").toISOString(),
        endedAt: null,
        outcome: null,
        selectedItemId: "clownfish",
        awardedItemId: null,
        pausedMs: 0,
      };
      const now = new Date("2026-01-01T00:05:00.000Z");
      expect(failSession(base, now)).toEqual({
        ...base,
        endedAt: now.toISOString(),
        outcome: "failed",
        awardedItemId: null,
      });
    });
  });

  describe("sessionProgress", () => {
    const base: FocusSession = {
      id: "s1",
      plannedDurationMinutes: 10,
      startedAt: new Date("2026-01-01T00:00:00.000Z").toISOString(),
      endedAt: null,
      outcome: null,
      selectedItemId: "clownfish",
      awardedItemId: null,
      pausedMs: 0,
    };

    it("is 0 at the start and 1 at completion, clamped", () => {
      expect(sessionProgress(base, new Date("2026-01-01T00:00:00.000Z"))).toBe(0);
      expect(sessionProgress(base, new Date("2026-01-01T00:05:00.000Z"))).toBeCloseTo(0.5);
      expect(sessionProgress(base, new Date("2026-01-01T00:20:00.000Z"))).toBe(1);
    });
  });

  describe("growthStage", () => {
    it("advances egg -> fish across progress", () => {
      expect(growthStage(0)).toBe("egg");
      expect(growthStage(0.32)).toBe("egg");
      expect(growthStage(1 / 3)).toBe("fish");
      expect(growthStage(0.6)).toBe("fish");
      expect(growthStage(2 / 3)).toBe("fish");
      expect(growthStage(1)).toBe("fish");
    });
  });
});
