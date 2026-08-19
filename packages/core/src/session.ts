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
