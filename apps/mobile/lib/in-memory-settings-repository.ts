import type { Settings, SettingsRepository } from '@nalvie/core';

import { DEFAULT_SETTINGS } from './default-settings';

// In-memory implementation of SettingsRepository, used only in tests
export function createInMemorySettingsRepository(): SettingsRepository {
  let settings: Settings = DEFAULT_SETTINGS;

  return {
    async getSettings() {
      return settings;
    },
    async saveSettings(next) {
      settings = next;
    },
  };
}
