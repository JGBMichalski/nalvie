import { renderRouter, screen } from 'expo-router/testing-library';
import { act, fireEvent } from '@testing-library/react-native';
import { UNLOCK_POOL, unlockPoolItemToTankItem } from '@nalvie/core';

import { resetSessionRepositoryForTests, sessionRepository, settingsRepository } from '../lib/repository';
import { DEFAULT_SETTINGS } from '../lib/default-settings';

describe('dev "clear database" menu action', () => {
  beforeEach(async () => {
    resetSessionRepositoryForTests();
    await settingsRepository.saveSettings({ ...DEFAULT_SETTINGS, hasCompletedOnboarding: true });
    await sessionRepository.saveTankItem(
      unlockPoolItemToTankItem(UNLOCK_POOL, 'clownfish', 'clownfish', new Date().toISOString()),
    );
  });

  it('wipes tank items and settings, then lands on onboarding like a fresh install', async () => {
    renderRouter('./app', { initialUrl: '/' });

    fireEvent.press(await screen.findByLabelText('Open menu'));
    fireEvent.press(await screen.findByText('Clear database (dev)'));
    await act(async () => {}); // flush the wipe + navigation

    expect(screen).toHavePathname('/onboarding');
    expect(await sessionRepository.listTankItems()).toHaveLength(0);
    expect((await settingsRepository.getSettings())).toEqual(DEFAULT_SETTINGS);
  });
});
