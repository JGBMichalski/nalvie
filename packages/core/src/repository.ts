import type { FocusSession, Settings, TankItem } from "./types.js";

// Implemented per-platform (expo-sqlite on mobile, IndexedDB/sql.js on web)
export interface SessionRepository {
  saveSession(session: FocusSession): Promise<void>;
  getSession(id: string): Promise<FocusSession | null>;
  listSessions(): Promise<FocusSession[]>;
  getInProgressSession(): Promise<FocusSession | null>; // returns null if no session is in progress

  saveTankItem(item: TankItem): Promise<void>;
  listTankItems(): Promise<TankItem[]>;
}

// Mirrors SessionRepository's per-platform storage pattern.
export interface SettingsRepository {
  getSettings(): Promise<Settings>;
  saveSettings(settings: Settings): Promise<void>;
}
