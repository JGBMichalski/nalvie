import { STARTER_SPECIES_IDS, type FocusSession, type SessionRepository, type TankItem, type UnlockedSpecies } from '@nalvie/core';

// In-memory implementation of SessionRepository, used only in tests
export function createInMemorySessionRepository(): SessionRepository {
  const sessions = new Map<string, FocusSession>();
  const tankItems = new Map<string, TankItem>();
  const unlockedSpecies = new Map<string, UnlockedSpecies>();

  const seededAt = new Date().toISOString();
  for (const speciesId of STARTER_SPECIES_IDS) {
    unlockedSpecies.set(speciesId, { speciesId, unlockedAt: seededAt });
  }

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
    async clearTankItems() {
      tankItems.clear();
    },
    async saveUnlockedSpecies(entry) {
      unlockedSpecies.set(entry.speciesId, entry);
    },
    async listUnlockedSpecies() {
      return [...unlockedSpecies.values()];
    },
  };
}
