import { renderRouter, screen } from 'expo-router/testing-library';
import { act, fireEvent } from '@testing-library/react-native';

import { resetSessionRepositoryForTests, settingsRepository } from '../lib/repository';
import { DEFAULT_SETTINGS } from '../lib/default-settings';

// Integration test over the real app/ directory
describe('navigation shell', () => {
  beforeEach(async () => {
    resetSessionRepositoryForTests();
    // These tests exercise the app past first launch — onboarding is covered
    // separately in OnboardingScreen.test.tsx / HomeOnboardingGate.test.tsx.
    await settingsRepository.saveSettings({ ...DEFAULT_SETTINGS, hasCompletedOnboarding: true });
  });

  it('starts on Home/Tank', async () => {
    renderRouter('./app', { initialUrl: '/' });

    expect(await screen.findByText(/streak/)).toBeTruthy();
    expect(screen).toHavePathname('/');
  });

  it('opens the menu from Home, then reaches Stats and Settings from it', async () => {
    renderRouter('./app', { initialUrl: '/' });

    fireEvent.press(await screen.findByLabelText('Open menu'));
    expect(screen).toHavePathname('/menu');

    fireEvent.press(await screen.findByText('Stats'));
    expect(screen).toHavePathname('/stats');
    await act(async () => {}); // flush Stats' repository load
  });
});
