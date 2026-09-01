import { act, fireEvent } from '@testing-library/react-native';
import { renderRouter, screen } from 'expo-router/testing-library';

import { settingsRepository } from '../lib/repository';

describe('<OnboardingScreen />', () => {
  it('shows the first screen with a Skip link', async () => {
    renderRouter('./app', { initialUrl: '/onboarding' });

    expect(await screen.findByText(/Grow a living tank/)).toBeTruthy();
    expect(screen.getByText('Skip')).toBeTruthy();
  });

  it('advances to the second screen via Next', async () => {
    renderRouter('./app', { initialUrl: '/onboarding' });

    fireEvent.press(await screen.findByText('Next'));

    expect(await screen.findByText(/Earn points, unlock fish/)).toBeTruthy();
    expect(screen.getByText('Next')).toBeTruthy();
  });

  it('advances to the third screen via Next twice', async () => {
    renderRouter('./app', { initialUrl: '/onboarding' });

    fireEvent.press(await screen.findByText('Next'));
    fireEvent.press(await screen.findByText('Next'));

    expect(await screen.findByText(/Leave and lose it/)).toBeTruthy();
    expect(screen.getByText('Next')).toBeTruthy();
  });

  it('reaches the tank-theme picker on the final screen', async () => {
    renderRouter('./app', { initialUrl: '/onboarding' });

    fireEvent.press(await screen.findByText('Next'));
    fireEvent.press(await screen.findByText('Next'));
    fireEvent.press(await screen.findByText('Next'));

    expect(await screen.findByText(/Pick your tank/)).toBeTruthy();
    expect(screen.getByLabelText('Twilight')).toBeTruthy();
    expect(screen.getByText('Get started')).toBeTruthy();
  });

  it('selecting a tank theme persists it live', async () => {
    renderRouter('./app', { initialUrl: '/onboarding' });

    fireEvent.press(await screen.findByText('Next'));
    fireEvent.press(await screen.findByText('Next'));
    fireEvent.press(await screen.findByText('Next'));
    fireEvent.press(await screen.findByLabelText('Abyss'));
    await act(async () => {});

    expect((await settingsRepository.getSettings()).tankThemeId).toBe('abyss');
  });

  it('Skip marks onboarding complete and navigates to Home', async () => {
    renderRouter('./app', { initialUrl: '/onboarding' });

    fireEvent.press(await screen.findByText('Skip'));
    await act(async () => {});

    expect(screen).toHavePathname('/');
    expect((await settingsRepository.getSettings()).hasCompletedOnboarding).toBe(true);
  });

  it('Get started marks onboarding complete and navigates to Home', async () => {
    renderRouter('./app', { initialUrl: '/onboarding' });

    fireEvent.press(await screen.findByText('Next'));
    fireEvent.press(await screen.findByText('Next'));
    fireEvent.press(await screen.findByText('Next'));
    fireEvent.press(await screen.findByText('Get started'));
    await act(async () => {});

    expect(screen).toHavePathname('/');
    expect((await settingsRepository.getSettings()).hasCompletedOnboarding).toBe(true);
  });
});
