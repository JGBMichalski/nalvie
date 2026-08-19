import type { FocusSession } from "./types.js";

/** Per the spec: sessions fail on backgrounding, absorbed by this grace period. */
export const GRACE_PERIOD_MS = 15_000;

/** Per the spec: 1 manual pause per session, capped at this duration. */
export const MAX_PAUSE_MS = 2 * 60_000;

export const MIN_SESSION_MINUTES = 10;

export const SESSION_PRESET_MINUTES = [10, 25, 50] as const;

/**
 * Timestamp-based elapsed time calculation. Per the spec, no true background
 * execution is needed — a session that's backgrounded is already at risk of
 * failing, so we only need start/end timestamps recomputed on resume.
 */
export function elapsedMs(session: Pick<FocusSession, "startedAt">, now: Date = new Date()): number {
  return now.getTime() - new Date(session.startedAt).getTime();
}

export function isSessionComplete(
  session: Pick<FocusSession, "startedAt" | "plannedDurationMinutes">,
  now: Date = new Date()
): boolean {
  return elapsedMs(session, now) >= session.plannedDurationMinutes * 60_000;
}
