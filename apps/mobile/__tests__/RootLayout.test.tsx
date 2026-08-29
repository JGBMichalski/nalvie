import { act } from '@testing-library/react-native';
import { renderRouter } from 'expo-router/testing-library';
import * as Notifications from 'expo-notifications';

import { resetSessionRepositoryForTests, settingsRepository } from '../lib/repository';
import { DEFAULT_SETTINGS } from '../lib/default-settings';

describe('RootLayout', () => {
  beforeEach(async () => {
    jest.clearAllMocks();
    resetSessionRepositoryForTests();
    await settingsRepository.saveSettings({ ...DEFAULT_SETTINGS, hasCompletedOnboarding: true });
    (Notifications.getPermissionsAsync as jest.Mock).mockResolvedValue({
      status: 'undetermined',
      canAskAgain: true,
    });
  });

  it('requests notification permission once when the app opens', async () => {
    renderRouter('./app', { initialUrl: '/' });
    await act(async () => {});

    expect(Notifications.requestPermissionsAsync).toHaveBeenCalledTimes(1);
  });

  it('does not re-prompt if permission is already granted', async () => {
    (Notifications.getPermissionsAsync as jest.Mock).mockResolvedValue({ status: 'granted', canAskAgain: true });
    renderRouter('./app', { initialUrl: '/' });
    await act(async () => {});

    expect(Notifications.requestPermissionsAsync).not.toHaveBeenCalled();
  });
});
