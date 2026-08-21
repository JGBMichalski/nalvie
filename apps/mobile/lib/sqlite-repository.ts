import type { FocusSession, SessionRepository, Settings, SettingsRepository, TankItem } from '@nalvie/core';

import { DEFAULT_SETTINGS } from './default-settings';
import { getDatabase } from './sqlite-db';
import {
  rowToSession,
  rowToSettings,
  rowToTankItem,
  sessionToRow,
  settingsToRow,
  tankItemToRow,
  SETTINGS_ROW_ID,
  type SessionRow,
  type SettingsRow,
  type TankItemRow,
} from './sqlite-rows';

// Both repositories below share one expo-sqlite database (see sqlite-db.ts)
// — sessions/tank items and settings are separate core interfaces (different
// domain concerns, different consumers), but the same physical storage.

export function createSqliteSessionRepository(): SessionRepository {
  return {
    async saveSession(session: FocusSession) {
      const row = sessionToRow(session);
      await getDatabase().runAsync(
        `INSERT OR REPLACE INTO sessions
          (id, planned_duration_minutes, started_at, ended_at, outcome, selected_item_id, awarded_item_id, paused_ms)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          row.id,
          row.planned_duration_minutes,
          row.started_at,
          row.ended_at,
          row.outcome,
          row.selected_item_id,
          row.awarded_item_id,
          row.paused_ms,
        ],
      );
    },

    async getSession(id: string) {
      const row = await getDatabase().getFirstAsync<SessionRow>('SELECT * FROM sessions WHERE id = ?', [id]);
      return row ? rowToSession(row) : null;
    },

    async listSessions() {
      const rows = await getDatabase().getAllAsync<SessionRow>('SELECT * FROM sessions');
      return rows.map(rowToSession);
    },

    async getInProgressSession() {
      const row = await getDatabase().getFirstAsync<SessionRow>(
        'SELECT * FROM sessions WHERE outcome IS NULL LIMIT 1',
      );
      return row ? rowToSession(row) : null;
    },

    async saveTankItem(item: TankItem) {
      const row = tankItemToRow(item);
      await getDatabase().runAsync(
        'INSERT OR REPLACE INTO tank_items (id, species_id, name, rarity, unlocked_at) VALUES (?, ?, ?, ?, ?)',
        [row.id, row.species_id, row.name, row.rarity, row.unlocked_at],
      );
    },

    async listTankItems() {
      const rows = await getDatabase().getAllAsync<TankItemRow>('SELECT * FROM tank_items');
      return rows.map(rowToTankItem);
    },
  };
}

export function createSqliteSettingsRepository(): SettingsRepository {
  return {
    async getSettings() {
      const row = await getDatabase().getFirstAsync<SettingsRow>('SELECT * FROM settings WHERE id = ?', [
        SETTINGS_ROW_ID,
      ]);
      return row ? rowToSettings(row) : DEFAULT_SETTINGS;
    },

    async saveSettings(settings: Settings) {
      const row = settingsToRow(settings);
      await getDatabase().runAsync(
        `INSERT OR REPLACE INTO settings
          (id, default_session_minutes, sound_enabled, dark_mode_override, notifications_enabled)
         VALUES (?, ?, ?, ?, ?)`,
        [row.id, row.default_session_minutes, row.sound_enabled, row.dark_mode_override, row.notifications_enabled],
      );
    },
  };
}
