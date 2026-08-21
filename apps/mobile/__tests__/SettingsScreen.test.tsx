import { act, fireEvent } from '@testing-library/react-native';
import { renderRouter, screen, testRouter } from 'expo-router/testing-library';
import * as Notifications from 'expo-notifications';

import { resetSettingsRepositoryForTests, settingsRepository } from '../lib/repository';

jest.mock('expo-notifications', () => ({
  getPermissionsAsync: jest.fn(),
  requestPermissionsAsync: jest.fn(),
}));

describe('<SettingsScreen />', () => {
  beforeEach(() => {
    resetSettingsRepositoryForTests();
    (Notifications.getPermissionsAsync as jest.Mock).mockResolvedValue({
      status: 'undetermined',
      canAskAgain: true,
    });
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
