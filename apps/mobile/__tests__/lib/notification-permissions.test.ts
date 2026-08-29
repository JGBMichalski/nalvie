import * as Notifications from 'expo-notifications';

import { hasNotificationPermission, requestNotificationPermission } from '../../lib/notification-permissions';

jest.mock('expo-notifications', () => ({
  getPermissionsAsync: jest.fn(),
  requestPermissionsAsync: jest.fn(),
}));

beforeEach(() => {
  jest.clearAllMocks();
});

describe('hasNotificationPermission', () => {
  it('is true when the OS reports granted', async () => {
    (Notifications.getPermissionsAsync as jest.Mock).mockResolvedValue({ status: 'granted' });
    expect(await hasNotificationPermission()).toBe(true);
  });

  it('is false when the OS reports denied or undetermined', async () => {
    (Notifications.getPermissionsAsync as jest.Mock).mockResolvedValue({ status: 'denied' });
    expect(await hasNotificationPermission()).toBe(false);

    (Notifications.getPermissionsAsync as jest.Mock).mockResolvedValue({ status: 'undetermined' });
    expect(await hasNotificationPermission()).toBe(false);
  });
});

describe('requestNotificationPermission', () => {
  it('returns true immediately when already granted, without prompting', async () => {
    (Notifications.getPermissionsAsync as jest.Mock).mockResolvedValue({ status: 'granted', canAskAgain: true });

    expect(await requestNotificationPermission()).toBe(true);
    expect(Notifications.requestPermissionsAsync).not.toHaveBeenCalled();
  });

  it('prompts for permission when undetermined and can ask again', async () => {
    (Notifications.getPermissionsAsync as jest.Mock).mockResolvedValue({
      status: 'undetermined',
      canAskAgain: true,
    });
    (Notifications.requestPermissionsAsync as jest.Mock).mockResolvedValue({ status: 'granted' });

    expect(await requestNotificationPermission()).toBe(true);
    expect(Notifications.requestPermissionsAsync).toHaveBeenCalled();
  });

  it('returns false when the user declines the prompt', async () => {
    (Notifications.getPermissionsAsync as jest.Mock).mockResolvedValue({
      status: 'undetermined',
      canAskAgain: true,
    });
    (Notifications.requestPermissionsAsync as jest.Mock).mockResolvedValue({ status: 'denied' });

    expect(await requestNotificationPermission()).toBe(false);
  });

  it('resolves false immediately once already permanently denied — safe to call unconditionally on every launch', async () => {
    (Notifications.getPermissionsAsync as jest.Mock).mockResolvedValue({
      status: 'denied',
      canAskAgain: false,
    });

    expect(await requestNotificationPermission()).toBe(false);
    expect(Notifications.requestPermissionsAsync).not.toHaveBeenCalled();
  });
});
