import { act, fireEvent } from '@testing-library/react-native';
import { renderRouter, screen } from 'expo-router/testing-library';
import { useAudioPlayer } from 'expo-audio';
import { Alert } from 'react-native';

import { resetSessionRepositoryForTests, resetSettingsRepositoryForTests, sessionRepository, settingsRepository } from '../lib/repository';

describe('<SettingsScreen />', () => {
  beforeEach(() => {
    resetSettingsRepositoryForTests();
    resetSessionRepositoryForTests();
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

  describe('Clear tank', () => {
    it('shows a Clear tank action', async () => {
      renderRouter('./app', { initialUrl: '/settings' });
      await act(async () => {});

      expect(await screen.findByText('Clear tank')).toBeTruthy();
    });

    it('prompts for confirmation before clearing', async () => {
      const alertSpy = jest.spyOn(Alert, 'alert').mockImplementation();
      renderRouter('./app', { initialUrl: '/settings' });
      await act(async () => {});

      fireEvent.press(await screen.findByText('Clear tank'));

      expect(alertSpy).toHaveBeenCalledWith(
        'Clear tank?',
        expect.stringMatching(/fish you've unlocked/i),
        expect.arrayContaining([expect.objectContaining({ text: 'Clear tank' })]),
      );
      alertSpy.mockRestore();
    });

    it('deletes every tank item once confirmed, without touching the unlocked-species ledger', async () => {
      await sessionRepository.saveTankItem({
        id: 'instance-1',
        speciesId: 'clownfish',
        name: 'Clownfish',
        rarity: 'common',
        unlockedAt: new Date().toISOString(),
      });
      const ownedBefore = await sessionRepository.listUnlockedSpecies();

      const alertSpy = jest.spyOn(Alert, 'alert').mockImplementation((_title, _msg, buttons) => {
        const confirmButton = buttons?.find((button) => button.text === 'Clear tank');
        confirmButton?.onPress?.();
      });
      renderRouter('./app', { initialUrl: '/settings' });
      await act(async () => {});

      fireEvent.press(await screen.findByText('Clear tank'));
      await act(async () => {});

      expect(await sessionRepository.listTankItems()).toEqual([]);
      expect(await sessionRepository.listUnlockedSpecies()).toEqual(ownedBefore);
      alertSpy.mockRestore();
    });

    it('does nothing when the confirmation is cancelled', async () => {
      await sessionRepository.saveTankItem({
        id: 'instance-1',
        speciesId: 'clownfish',
        name: 'Clownfish',
        rarity: 'common',
        unlockedAt: new Date().toISOString(),
      });

      const alertSpy = jest.spyOn(Alert, 'alert').mockImplementation();
      renderRouter('./app', { initialUrl: '/settings' });
      await act(async () => {});

      fireEvent.press(await screen.findByText('Clear tank'));
      await act(async () => {});

      expect(await sessionRepository.listTankItems()).toHaveLength(1);
      alertSpy.mockRestore();
    });
  });
});
