import type { FocusSession, SessionRepository, TankItem } from '@nalvie/core';

// In-memory implementation of SessionRepository, used only in tests
export function createInMemorySessionRepository(): SessionRepository {
  const sessions = new Map<string, FocusSession>();
  const tankItems = new Map<string, TankItem>();

  return {
    async saveSession(session) {
      sessions.set(session.id, session);
    },
    async getSession(id) {
      return sessions.get(id) ?? null;
    },
    async listSessions() {
      return [...sessions.values()];
    },
    async getInProgressSession() {
      return [...sessions.values()].find((s) => s.outcome === null) ?? null;
    },
    async saveTankItem(item) {
      tankItems.set(item.id, item);
    },
    async listTankItems() {
      return [...tankItems.values()];
    },
  };
}
