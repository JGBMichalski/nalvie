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

  it('shows a toast for the chosen fish when the session completes, then returns to idle', async () => {
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

    expect(screen.getByText('A Clownfish has joined your tank!')).toBeTruthy();

    await act(async () => {
      jest.advanceTimersByTime(3000);
    });

    expect(screen.getByLabelText('Start a session')).toBeTruthy(); // FAB is back
  });

  it('shows a Mute button during a session when sound is enabled, and it toggles', async () => {
    await settingsRepository.saveSettings({ ...DEFAULT_SETTINGS, hasCompletedOnboarding: true, soundEnabled: true });
    renderRouter('./app', { initialUrl: '/' });
    await act(async () => {});

    fireEvent.press(await screen.findByLabelText('Start a session'));
    fireEvent.press(screen.getByText('Clownfish'));
    fireEvent.press(screen.getByText('Start'));
    await act(async () => {}); // flush startSession's repository write

    fireEvent.press(screen.getByText('Mute'));
    expect(screen.getByText('Unmute')).toBeTruthy();

    fireEvent.press(screen.getByText('Unmute'));
    expect(screen.getByText('Mute')).toBeTruthy();
  });

  it('does not show a Mute button when sound is disabled in Settings', async () => {
    await settingsRepository.saveSettings({ ...DEFAULT_SETTINGS, hasCompletedOnboarding: true, soundEnabled: false });
    renderRouter('./app', { initialUrl: '/' });
    await act(async () => {});

    fireEvent.press(await screen.findByLabelText('Start a session'));
    fireEvent.press(screen.getByText('Clownfish'));
    fireEvent.press(screen.getByText('Start'));
    await act(async () => {}); // flush startSession's repository write

    expect(screen.queryByText('Mute')).toBeNull();
  });

  it('shows the SomaFM station attribution during a session when that source is selected', async () => {
    await settingsRepository.saveSettings({
      ...DEFAULT_SETTINGS,
      hasCompletedOnboarding: true,
      soundEnabled: true,
      soundSource: 'somafm',
      somafmStationId: 'dronezone',
    });
    renderRouter('./app', { initialUrl: '/' });
    await act(async () => {});

    fireEvent.press(await screen.findByLabelText('Start a session'));
    fireEvent.press(screen.getByText('Clownfish'));
    fireEvent.press(screen.getByText('Start'));
    await act(async () => {}); // flush startSession's repository write

    expect(screen.getByText(/SomaFM — Drone Zone/)).toBeTruthy();
  });

  it('does not show SomaFM attribution when the local sound source is selected', async () => {
    await settingsRepository.saveSettings({
      ...DEFAULT_SETTINGS,
      hasCompletedOnboarding: true,
      soundEnabled: true,
      soundSource: 'local',
    });
    renderRouter('./app', { initialUrl: '/' });
    await act(async () => {});

    fireEvent.press(await screen.findByLabelText('Start a session'));
    fireEvent.press(screen.getByText('Clownfish'));
    fireEvent.press(screen.getByText('Start'));
    await act(async () => {}); // flush startSession's repository write

    expect(screen.queryByText(/SomaFM/)).toBeNull();
  });

  it('hides the SomaFM attribution while the session ambience is muted', async () => {
    await settingsRepository.saveSettings({
      ...DEFAULT_SETTINGS,
      hasCompletedOnboarding: true,
      soundEnabled: true,
      soundSource: 'somafm',
      somafmStationId: 'dronezone',
    });
    renderRouter('./app', { initialUrl: '/' });
    await act(async () => {});

    fireEvent.press(await screen.findByLabelText('Start a session'));
    fireEvent.press(screen.getByText('Clownfish'));
    fireEvent.press(screen.getByText('Start'));
    await act(async () => {}); // flush startSession's repository write
    expect(screen.getByText(/SomaFM — Drone Zone/)).toBeTruthy();

    fireEvent.press(screen.getByText('Mute'));

    expect(screen.queryByText(/SomaFM/)).toBeNull();
  });

  it('shows Stats and Settings buttons flanking the FAB while idle', async () => {
    renderRouter('./app', { initialUrl: '/' });
    await act(async () => {});

    expect(await screen.findByLabelText('Stats')).toBeTruthy();
    expect(screen.getByLabelText('Settings')).toBeTruthy();
  });

  it('hides Stats and Settings buttons during a session', async () => {
    renderRouter('./app', { initialUrl: '/' });
    await act(async () => {});

    fireEvent.press(await screen.findByLabelText('Start a session'));
    fireEvent.press(screen.getByText('Clownfish'));
    fireEvent.press(screen.getByText('Start'));
    await act(async () => {}); // flush startSession's repository write

    expect(screen.queryByLabelText('Stats')).toBeNull();
    expect(screen.queryByLabelText('Settings')).toBeNull();
  });

  describe('switching SomaFM station mid-session', () => {
    beforeEach(async () => {
      await settingsRepository.saveSettings({
        ...DEFAULT_SETTINGS,
        hasCompletedOnboarding: true,
        soundEnabled: true,
        soundSource: 'somafm',
        somafmStationId: 'groovesalad',
      });
    });

    it('opens a station picker from the attribution control and switches station', async () => {
      renderRouter('./app', { initialUrl: '/' });
      await act(async () => {});

      fireEvent.press(await screen.findByLabelText('Start a session'));
      fireEvent.press(screen.getByText('Clownfish'));
      fireEvent.press(screen.getByText('Start'));
      await act(async () => {}); // flush startSession's repository write
      expect(screen.getByText(/SomaFM — Groove Salad/)).toBeTruthy();

      fireEvent.press(screen.getByLabelText('Change station'));
      await act(async () => {});
      fireEvent.press(screen.getByLabelText('Fluid'));
      await act(async () => {});

      expect(screen.getByText(/SomaFM — Fluid/)).toBeTruthy();
      expect((await settingsRepository.getSettings()).somafmStationId).toBe('fluid');
    });

    it('does not offer a station switch when using the local sound source', async () => {
      await settingsRepository.saveSettings({
        ...DEFAULT_SETTINGS,
        hasCompletedOnboarding: true,
        soundEnabled: true,
        soundSource: 'local',
      });
      renderRouter('./app', { initialUrl: '/' });
      await act(async () => {});

      fireEvent.press(await screen.findByLabelText('Start a session'));
      fireEvent.press(screen.getByText('Clownfish'));
      fireEvent.press(screen.getByText('Start'));
      await act(async () => {}); // flush startSession's repository write

      expect(screen.queryByLabelText('Change station')).toBeNull();
    });
  });
});
