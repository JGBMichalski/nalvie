import type { SessionRepository, SettingsRepository } from '@nalvie/core';

import { createInMemorySessionRepository } from './in-memory-session-repository';
import { createInMemorySettingsRepository } from './in-memory-settings-repository';
import { createSqliteSessionRepository, createSqliteSettingsRepository } from './sqlite-repository';

// Shared singleton instances for the whole app's lifetime, so screens
// outside the Home/Tank hierarchy (e.g. a dev menu action) write to the
// same store other screens read from.
let sessionBacking: SessionRepository = createSqliteSessionRepository();
let settingsBacking: SettingsRepository = createSqliteSettingsRepository();

export const sessionRepository: SessionRepository = {
  saveSession: (session) => sessionBacking.saveSession(session),
  getSession: (id) => sessionBacking.getSession(id),
  listSessions: () => sessionBacking.listSessions(),
  getInProgressSession: () => sessionBacking.getInProgressSession(),
  saveTankItem: (item) => sessionBacking.saveTankItem(item),
  listTankItems: () => sessionBacking.listTankItems(),
};

export const settingsRepository: SettingsRepository = {
  getSettings: () => settingsBacking.getSettings(),
  saveSettings: (settings) => settingsBacking.saveSettings(settings),
};

// Test-only: swaps in a fresh in-memory store.
export function resetSessionRepositoryForTests(): void {
  sessionBacking = createInMemorySessionRepository();
}

// Test-only: swaps in a fresh in-memory store.
export function resetSettingsRepositoryForTests(): void {
  settingsBacking = createInMemorySettingsRepository();
}
