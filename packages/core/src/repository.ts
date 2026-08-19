import type { DailyStats, FocusSession, StreakInfo, TankItem } from "./types.js";

/**
 * Storage abstraction implemented per-platform (expo-sqlite on mobile,
 * IndexedDB/sql.js on web, Node-based SQLite on desktop). Core logic never
 * touches a concrete storage API directly — see the spec sheet's
 * "Storage abstraction" decision.
 */
export interface SessionRepository {
  saveSession(session: FocusSession): Promise<void>;
  getSession(id: string): Promise<FocusSession | null>;
  listSessions(): Promise<FocusSession[]>;

  saveTankItem(item: TankItem): Promise<void>;
  listTankItems(): Promise<TankItem[]>;

  getDailyStats(): Promise<DailyStats[]>;
  getStreak(): Promise<StreakInfo>;
}
