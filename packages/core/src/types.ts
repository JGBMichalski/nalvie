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
  selectedItemId: string; // Fish/item the user chose to add on completion
  awardedItemId: string | null; // ID awarded for completing this session, if any.
  pausedMs: number; // Total time spent paused, in milliseconds.
}

export interface TankItem {
  id: string; // Unique instance id
  speciesId: string; // Catalog id (shared by every instance of the species)
  name: string;
  rarity: "common" | "uncommon" | "rare"; // The rarity of the item, which may affect its drop rate.
  unlockedAt: string | null; // ISO 8601, null if not yet unlocked
}

export interface UnlockedSpecies {
  speciesId: string; // Catalog id, matches UnlockPoolItem.id
  unlockedAt: string; // ISO 8601
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
  hasCompletedOnboarding: boolean; // gates the first-launch intro flow
  soundSource: "local" | "somafm"; // which ambient audio plays when soundEnabled is true
  somafmStationId: string; // only meaningful when soundSource is "somafm"
  pointsBalance: number; // earned by completed sessions, spent unlocking species
  tankThemeId: string; // selected tank background theme (see tank-themes.ts)
}

// Pure state a session/tank screen can be in.
export type SessionAnimationState = "idle" | "focusing" | "growing" | "celebrating" | "interrupted";
