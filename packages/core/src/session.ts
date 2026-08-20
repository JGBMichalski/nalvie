import type { FocusSession } from "./types.js";
import type { SessionRepository } from "./repository.js";

export const GRACE_PERIOD_MS = 15_000;
export const MAX_PAUSE_MS = 2 * 60_000;
export const MIN_SESSION_MINUTES = 10;
export const SESSION_PRESET_MINUTES = [10, 25, 50] as const;

/**
 * Timestamp-based elapsed time calculation. No true background execution is needed,
 * so we only need start/end timestamps recomputed on resume.
 */
export function elapsedMs(session: Pick<FocusSession, "startedAt" | "pausedMs">, now: Date = new Date()): number {
  return now.getTime() - new Date(session.startedAt).getTime() - session.pausedMs;
}

export function isSessionComplete(
  session: Pick<FocusSession, "startedAt" | "plannedDurationMinutes" | "pausedMs">,
  now: Date = new Date()
): boolean {
  return elapsedMs(session, now) >= session.plannedDurationMinutes * 60_000;
}

/**
 * Call once on app launch. If a session was left in-progress (force-quit
 * before it could be finalized), it's retroactively marked failed — per the
 * spec, an interrupted session = failed.
 */
export async function finalizeInterruptedSession(repository: SessionRepository, now: Date = new Date()): Promise<void> {
  const inProgress = await repository.getInProgressSession();
  if (!inProgress) return;

  await repository.saveSession({
    ...inProgress,
    endedAt: now.toISOString(),
    outcome: "failed",
  });
}

export function createSession(
  id: string,
  plannedDurationMinutes: number,
  selectedItemId: string,
  now: Date = new Date(),
): FocusSession {
  return {
    id,
    plannedDurationMinutes,
    startedAt: now.toISOString(),
    endedAt: null,
    outcome: null,
    selectedItemId,
    awardedItemId: null,
    pausedMs: 0,
  };
}

// Pause is single-use per session, so "already used" is just "any pause time recorded".
export function hasUsedPause(session: Pick<FocusSession, "pausedMs">): boolean {
  return session.pausedMs > 0;
}

export function applyPause(session: FocusSession, pauseDurationMs: number): FocusSession {
  if (hasUsedPause(session)) return session; // single use per session
  // Clamp to at least 1ms so even a near-instant pause/resume registers as "used"
  const cappedMs = Math.min(Math.max(pauseDurationMs, 1), MAX_PAUSE_MS);
  return { ...session, pausedMs: cappedMs };
}

export function completeSession(session: FocusSession, now: Date = new Date()): FocusSession {
  return { ...session, endedAt: now.toISOString(), outcome: "completed", awardedItemId: session.selectedItemId };
}

export function failSession(session: FocusSession, now: Date = new Date()): FocusSession {
  return { ...session, endedAt: now.toISOString(), outcome: "failed", awardedItemId: null };
}
