import { describe, expect, it } from "vitest";
import { elapsedMs, isSessionComplete } from "./session.js";

describe("session", () => {
  it("computes elapsed time from start timestamp", () => {
    const startedAt = new Date("2026-01-01T00:00:00.000Z").toISOString();
    const now = new Date("2026-01-01T00:00:05.000Z");
    expect(elapsedMs({ startedAt }, now)).toBe(5000);
  });

  it("is not complete before the planned duration elapses", () => {
    const startedAt = new Date("2026-01-01T00:00:00.000Z").toISOString();
    const now = new Date("2026-01-01T00:09:00.000Z");
    expect(isSessionComplete({ startedAt, plannedDurationMinutes: 10 }, now)).toBe(false);
  });

  it("is complete once the planned duration elapses", () => {
    const startedAt = new Date("2026-01-01T00:00:00.000Z").toISOString();
    const now = new Date("2026-01-01T00:10:00.000Z");
    expect(isSessionComplete({ startedAt, plannedDurationMinutes: 10 }, now)).toBe(true);
  });
});
