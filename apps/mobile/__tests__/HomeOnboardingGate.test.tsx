import { act } from '@testing-library/react-native';
import { renderRouter, screen } from 'expo-router/testing-library';

import { settingsRepository } from '../lib/repository';
import { DEFAULT_SETTINGS } from '../lib/default-settings';

describe('Home onboarding gate', () => {
  it('redirects to onboarding on first launch', async () => {
    renderRouter('./app', { initialUrl: '/' });

    expect(await screen.findByText(/Grow a living tank/)).toBeTruthy();
    expect(screen).toHavePathname('/onboarding');
  });

  it('stays on Home once onboarding is already completed', async () => {
    await settingsRepository.saveSettings({ ...DEFAULT_SETTINGS, hasCompletedOnboarding: true });

    renderRouter('./app', { initialUrl: '/' });
    await act(async () => {});

    expect(await screen.findByText(/streak/)).toBeTruthy();
    expect(screen).toHavePathname('/');
  });
});
