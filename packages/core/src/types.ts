/**
 * Core domain types for Nalvie, shared across all platforms.
 */

export type SessionOutcome = "completed" | "failed";

export interface FocusSession {
  id: string;
  plannedDurationMinutes: number; // The user-selected session length, in minutes.
  startedAt: string; // ISO 8601
  endedAt: string | null; // ISO 8601, null while in progress
  outcome: SessionOutcome | null; // null while in progress
  awardedItemId: string | null; // ID awarded for completing this session, if any.
  pausedMs: number; // Total time spent paused, in milliseconds.
}

export interface TankItem {
  id: string;
  name: string;
  rarity: "common" | "uncommon" | "rare"; // The rarity of the item, which may affect its drop rate.
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

export interface Settings {
  defaultSessionMinutes: number;
  soundEnabled: boolean;
  darkModeOverride: boolean | null; // null = follow system, true = dark, false = light
  notificationsEnabled: boolean;
}
