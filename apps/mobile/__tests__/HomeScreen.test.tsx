import { act, fireEvent } from '@testing-library/react-native';
import { renderRouter, screen } from 'expo-router/testing-library';
import { MIN_SESSION_MINUTES } from '@nalvie/core';

import { resetSessionRepositoryForTests, settingsRepository } from '../lib/repository';
import { DEFAULT_SETTINGS } from '../lib/default-settings';

describe('<HomeScreen />', () => {
  beforeEach(async () => {
    resetSessionRepositoryForTests();
    await settingsRepository.saveSettings({ ...DEFAULT_SETTINGS, hasCompletedOnboarding: true });
  });

  it('opens the fish picker from the FAB, then the duration picker, then starts a session showing a countdown', async () => {
    renderRouter('./app', { initialUrl: '/' });
    await act(async () => {}); // flush mount-time repository load

    fireEvent.press(await screen.findByLabelText('Start a session'));
    expect(screen.getByText('Choose a fish')).toBeTruthy();

    fireEvent.press(screen.getByText('Clownfish'));
    expect(screen.getByText('Start a session')).toBeTruthy(); // duration sheet title

    fireEvent.press(screen.getByText('Start'));
    await act(async () => {}); // flush startSession's repository write

    expect(screen.getByText(`${MIN_SESSION_MINUTES}:00`)).toBeTruthy();
    expect(screen.getByText('Pause')).toBeTruthy();
  });

  it('toggles the pause button through Pause -> Resume -> Pause used', async () => {
    renderRouter('./app', { initialUrl: '/' });
    await act(async () => {});

    fireEvent.press(await screen.findByLabelText('Start a session'));
    fireEvent.press(screen.getByText('Clownfish'));
    fireEvent.press(screen.getByText('Start'));
    await act(async () => {}); // flush startSession's repository write

    fireEvent.press(screen.getByText('Pause'));
    expect(screen.getByText('Resume')).toBeTruthy();

    fireEvent.press(screen.getByText('Resume'));
    expect(screen.getByText('Pause used')).toBeTruthy();
  });

  it('shows an unlock toast for the chosen fish when the session completes, then returns to idle', async () => {
    renderRouter('./app', { initialUrl: '/' });
    await act(async () => {});

    fireEvent.press(await screen.findByLabelText('Start a session'));
    fireEvent.press(screen.getByText('Clownfish'));
    fireEvent.press(screen.getByText('Start'));
    await act(async () => {}); // flush startSession's repository write

    await act(async () => {
      jest.advanceTimersByTime(MIN_SESSION_MINUTES * 60_000 + 1000);
      await Promise.resolve();
    });

    expect(screen.getByText('Unlocked: Clownfish!')).toBeTruthy();

    await act(async () => {
      jest.advanceTimersByTime(3000);
    });

    expect(screen.getByLabelText('Start a session')).toBeTruthy(); // FAB is back
  });
});
