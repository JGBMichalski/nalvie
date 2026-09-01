import type { Settings } from '@nalvie/core';

import { DEFAULT_SETTINGS } from '../../lib/default-settings';
import { createInMemorySettingsRepository } from '../../lib/in-memory-settings-repository';

describe('createInMemorySettingsRepository', () => {
  it('returns the default settings before anything has been saved', async () => {
    const repo = createInMemorySettingsRepository();
    expect(await repo.getSettings()).toEqual(DEFAULT_SETTINGS);
  });

  it('round-trips saved settings', async () => {
    const repo = createInMemorySettingsRepository();
    const settings: Settings = {
      defaultSessionMinutes: 50,
      soundEnabled: false,
      hasCompletedOnboarding: true,
      soundSource: 'somafm',
      somafmStationId: 'dronezone',
      pointsBalance: 650,
      tankThemeId: 'twilight',
    };

    await repo.saveSettings(settings);

    expect(await repo.getSettings()).toEqual(settings);
  });
});
