import { act, fireEvent } from '@testing-library/react-native';
import { renderRouter, screen, testRouter } from 'expo-router/testing-library';
import * as Notifications from 'expo-notifications';
import { useAudioPlayer } from 'expo-audio';

import { resetSettingsRepositoryForTests, settingsRepository } from '../lib/repository';

jest.mock('expo-notifications', () => ({
  getPermissionsAsync: jest.fn(),
  requestPermissionsAsync: jest.fn(),
  scheduleNotificationAsync: jest.fn(),
  cancelScheduledNotificationAsync: jest.fn(),
  cancelAllScheduledNotificationsAsync: jest.fn(),
  SchedulableTriggerInputTypes: { DATE: 'date' },
}));

describe('<SettingsScreen />', () => {
  beforeEach(() => {
    resetSettingsRepositoryForTests();
    (Notifications.getPermissionsAsync as jest.Mock).mockResolvedValue({
      status: 'undetermined',
      canAskAgain: true,
    });
    (useAudioPlayer as jest.Mock).mockClear();
  });

  it('shows the default settings on first launch', async () => {
    renderRouter('./app', { initialUrl: '/settings' });
    await act(async () => {});

    expect(await screen.findByLabelText('25m')).toBeTruthy();
    expect(screen.getByLabelText('25m').props.accessibilityState.selected).toBe(true);
    expect(screen.getByLabelText('System').props.accessibilityState.selected).toBe(true);
  });

  it('persists a session-length change', async () => {
    renderRouter('./app', { initialUrl: '/settings' });
    await act(async () => {});

    fireEvent.press(await screen.findByLabelText('50m'));
    await act(async () => {});

    expect((await settingsRepository.getSettings()).defaultSessionMinutes).toBe(50);
  });

  it('persists a dark mode change', async () => {
    renderRouter('./app', { initialUrl: '/settings' });
    await act(async () => {});

    fireEvent.press(await screen.findByLabelText('Dark'));
    await act(async () => {});

    expect((await settingsRepository.getSettings()).darkModeOverride).toBe(true);
  });

  it('toggling sound off persists immediately', async () => {
    renderRouter('./app', { initialUrl: '/settings' });
    await act(async () => {});

    fireEvent(await screen.findByLabelText('Sound'), 'valueChange', false);
    await act(async () => {});

    expect((await settingsRepository.getSettings()).soundEnabled).toBe(false);
  });

  it('shows Local selected by default, with no station field, when sound is on', async () => {
    renderRouter('./app', { initialUrl: '/settings' });
    await act(async () => {});

    expect(await screen.findByLabelText('Local')).toBeTruthy();
    expect(screen.getByLabelText('Local').props.accessibilityState.selected).toBe(true);
    expect(screen.queryByLabelText('SomaFM station')).toBeNull();
  });

  it('hides the sound-source control entirely when sound is off', async () => {
    renderRouter('./app', { initialUrl: '/settings' });
    await act(async () => {});

    fireEvent(await screen.findByLabelText('Sound'), 'valueChange', false);
    await act(async () => {});

    expect(screen.queryByLabelText('Local')).toBeNull();
    expect(screen.queryByLabelText('SomaFM')).toBeNull();
  });

  it('persists switching the sound source to SomaFM, and reveals the station field defaulting to Groove Salad', async () => {
    renderRouter('./app', { initialUrl: '/settings' });
    await act(async () => {});

    fireEvent.press(await screen.findByLabelText('SomaFM'));
    await act(async () => {});

    expect((await settingsRepository.getSettings()).soundSource).toBe('somafm');
    expect(screen.getByText('Groove Salad')).toBeTruthy();
  });

  it('opens the station picker sheet and persists a station change', async () => {
    renderRouter('./app', { initialUrl: '/settings' });
    await act(async () => {});

    fireEvent.press(await screen.findByLabelText('SomaFM'));
    await act(async () => {});
    fireEvent.press(screen.getByLabelText('SomaFM station'));
    await act(async () => {});
    fireEvent.press(screen.getByLabelText('Drone Zone'));
    await act(async () => {});

    expect((await settingsRepository.getSettings()).somafmStationId).toBe('dronezone');
    expect(screen.getByText('Drone Zone')).toBeTruthy(); // field now shows the new selection
  });

  it('closes the station picker sheet after selecting a station', async () => {
    renderRouter('./app', { initialUrl: '/settings' });
    await act(async () => {});

    fireEvent.press(await screen.findByLabelText('SomaFM'));
    await act(async () => {});
    fireEvent.press(screen.getByLabelText('SomaFM station'));
    await act(async () => {});
    expect(screen.getByTestId('picker-sheet-backdrop')).toBeTruthy();

    fireEvent.press(screen.getByLabelText('Drone Zone'));
    await act(async () => {});

    expect(screen.queryByTestId('picker-sheet-backdrop')).toBeNull();
  });

  describe('previewing a SomaFM station', () => {
    async function switchToSomaFm() {
      renderRouter('./app', { initialUrl: '/settings' });
      await act(async () => {});
      fireEvent.press(await screen.findByLabelText('SomaFM'));
      await act(async () => {});
    }

    it('shows a Preview button once a SomaFM station is selected', async () => {
      await switchToSomaFm();

      expect(screen.getByLabelText('Preview station')).toBeTruthy();
    });

    it('plays the selected station and toggles the button to Stop preview', async () => {
      await switchToSomaFm();

      fireEvent.press(screen.getByLabelText('Preview station'));
      await act(async () => {});

      expect(screen.getByText('Stop preview')).toBeTruthy();
      const player = (useAudioPlayer as jest.Mock).mock.results.at(-1)?.value;
      expect(player.play).toHaveBeenCalled();
    });

    it('stops playback and reverts the button label when pressed again', async () => {
      await switchToSomaFm();

      fireEvent.press(screen.getByLabelText('Preview station'));
      await act(async () => {});
      const player = (useAudioPlayer as jest.Mock).mock.results.at(-1)?.value;

      fireEvent.press(screen.getByText('Stop preview'));
      await act(async () => {
        jest.advanceTimersByTime(1000); // let the fade-out finish
      });

      expect(screen.getByText('Preview')).toBeTruthy();
      expect(player.pause).toHaveBeenCalled();
    });

    it('switches playback to the new station when one is picked while previewing', async () => {
      await switchToSomaFm();

      fireEvent.press(screen.getByLabelText('Preview station'));
      await act(async () => {});
      const grooveSaladPlayer = (useAudioPlayer as jest.Mock).mock.results.at(-1)?.value;

      fireEvent.press(screen.getByLabelText('SomaFM station'));
      await act(async () => {});
      fireEvent.press(screen.getByLabelText('Drone Zone'));
      await act(async () => {});

      const droneZonePlayer = (useAudioPlayer as jest.Mock).mock.results.at(-1)?.value;
      expect(droneZonePlayer).not.toBe(grooveSaladPlayer);
      expect(droneZonePlayer.play).toHaveBeenCalled();
      expect(screen.getByText('Stop preview')).toBeTruthy(); // still previewing
    });

    it('stops the preview when Sound is turned off', async () => {
      await switchToSomaFm();

      fireEvent.press(screen.getByLabelText('Preview station'));
      await act(async () => {});
      expect(screen.getByText('Stop preview')).toBeTruthy();

      fireEvent(screen.getByLabelText('Sound'), 'valueChange', false);
      await act(async () => {});
      fireEvent(screen.getByLabelText('Sound'), 'valueChange', true);
      fireEvent.press(await screen.findByLabelText('SomaFM'));
      await act(async () => {});

      expect(screen.getByLabelText('Preview station')).toBeTruthy();
    });
  });

  it('requests OS permission when notifications are toggled on, and persists the result', async () => {
    (Notifications.requestPermissionsAsync as jest.Mock).mockResolvedValue({ status: 'granted' });
    renderRouter('./app', { initialUrl: '/settings' });
    await act(async () => {});

    fireEvent(await screen.findByLabelText('Notifications'), 'valueChange', true);
    await act(async () => {});

    expect(Notifications.requestPermissionsAsync).toHaveBeenCalled();
    expect((await settingsRepository.getSettings()).notificationsEnabled).toBe(true);
  });

  it('does not enable notifications when permission is declined', async () => {
    (Notifications.requestPermissionsAsync as jest.Mock).mockResolvedValue({ status: 'denied' });
    renderRouter('./app', { initialUrl: '/settings' });
    await act(async () => {});

    fireEvent(await screen.findByLabelText('Notifications'), 'valueChange', true);
    await act(async () => {});

    expect((await settingsRepository.getSettings()).notificationsEnabled).toBe(false);
  });

  it('re-checks OS permission on refocus, catching a permission revoked outside the app', async () => {
    (Notifications.requestPermissionsAsync as jest.Mock).mockResolvedValue({ status: 'granted' });
    renderRouter('./app', { initialUrl: '/settings' });
    await act(async () => {});

    fireEvent(await screen.findByLabelText('Notifications'), 'valueChange', true);
    await act(async () => {});
    expect(screen.getByLabelText('Notifications').props.value).toBe(true);

    // Permission revoked from outside the app (e.g. OS settings) while this
    // screen isn't focused; navigating away and back should pick it up.
    (Notifications.getPermissionsAsync as jest.Mock).mockResolvedValue({ status: 'denied', canAskAgain: true });
    testRouter.push('/');
    await act(async () => {});
    testRouter.back();
    await act(async () => {});

    expect(screen.getByLabelText('Notifications').props.value).toBe(false);
  });
});
