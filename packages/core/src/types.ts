/**
 * Core domain types for Nalvie, shared across all platforms (mobile, web, desktop).
 * This package has zero React Native dependencies — see the spec sheet for why.
 */

export type SessionOutcome = "completed" | "failed";

export interface FocusSession {
  id: string;
  /** Planned duration in minutes, chosen before the session started. */
  plannedDurationMinutes: number;
  startedAt: string; // ISO 8601
  endedAt: string | null; // ISO 8601, null while in progress
  outcome: SessionOutcome | null; // null while in progress
  /** Item id awarded on completion, if any. Null if failed or not yet resolved. */
  awardedItemId: string | null;
}

export interface TankItem {
  id: string;
  name: string;
  /** Rarity tier drives how likely this item is to be picked from the unlock pool. */
  rarity: "common" | "uncommon" | "rare";
  unlockedAt: string | null; // ISO 8601, null if not yet unlocked
}

export interface DailyStats {
  date: string; // YYYY-MM-DD
  completedSessions: number;
  failedSessions: number;
  totalFocusMinutes: number;
}

export interface StreakInfo {
  current: number;
  longest: number;
}
