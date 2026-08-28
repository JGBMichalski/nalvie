import type { FocusSession, Settings, TankItem } from '@nalvie/core';

/**
 * Mapping for the SQLite-backed repositories.
 */

export interface SessionRow {
  id: string;
  planned_duration_minutes: number;
  started_at: string;
  ended_at: string | null;
  outcome: string | null;
  selected_item_id: string;
  awarded_item_id: string | null;
  paused_ms: number;
}

export function sessionToRow(session: FocusSession): SessionRow {
  return {
    id: session.id,
    planned_duration_minutes: session.plannedDurationMinutes,
    started_at: session.startedAt,
    ended_at: session.endedAt,
    outcome: session.outcome,
    selected_item_id: session.selectedItemId,
    awarded_item_id: session.awardedItemId,
    paused_ms: session.pausedMs,
  };
}

export function rowToSession(row: SessionRow): FocusSession {
  return {
    id: row.id,
    plannedDurationMinutes: row.planned_duration_minutes,
    startedAt: row.started_at,
    endedAt: row.ended_at,
    outcome: row.outcome as FocusSession['outcome'],
    selectedItemId: row.selected_item_id,
    awardedItemId: row.awarded_item_id,
    pausedMs: row.paused_ms,
  };
}

export interface TankItemRow {
  id: string;
  species_id: string;
  name: string;
  rarity: string;
  unlocked_at: string | null;
}

export function tankItemToRow(item: TankItem): TankItemRow {
  return {
    id: item.id,
    species_id: item.speciesId,
    name: item.name,
    rarity: item.rarity,
    unlocked_at: item.unlockedAt,
  };
}

export function rowToTankItem(row: TankItemRow): TankItem {
  return {
    id: row.id,
    speciesId: row.species_id,
    name: row.name,
    rarity: row.rarity as TankItem['rarity'],
    unlockedAt: row.unlocked_at,
  };
}

// Settings is a single row, keyed by a fixed id so INSERT OR REPLACE always
// targets the same one.
export const SETTINGS_ROW_ID = 1;

export interface SettingsRow {
  id: number;
  default_session_minutes: number;
  sound_enabled: number;
  dark_mode_override: number | null; // 0/1, NULL = follow system
  notifications_enabled: number;
  has_completed_onboarding: number;
  sound_source: string; // "local" | "somafm"
  somafm_station_id: string;
}

export function settingsToRow(settings: Settings): SettingsRow {
  return {
    id: SETTINGS_ROW_ID,
    default_session_minutes: settings.defaultSessionMinutes,
    sound_enabled: settings.soundEnabled ? 1 : 0,
    dark_mode_override: settings.darkModeOverride === null ? null : settings.darkModeOverride ? 1 : 0,
    notifications_enabled: settings.notificationsEnabled ? 1 : 0,
    has_completed_onboarding: settings.hasCompletedOnboarding ? 1 : 0,
    sound_source: settings.soundSource,
    somafm_station_id: settings.somafmStationId,
  };
}

export function rowToSettings(row: SettingsRow): Settings {
  return {
    defaultSessionMinutes: row.default_session_minutes,
    soundEnabled: row.sound_enabled === 1,
    darkModeOverride: row.dark_mode_override === null ? null : row.dark_mode_override === 1,
    notificationsEnabled: row.notifications_enabled === 1,
    hasCompletedOnboarding: row.has_completed_onboarding === 1,
    soundSource: row.sound_source === 'somafm' ? 'somafm' : 'local',
    somafmStationId: row.somafm_station_id,
  };
}
