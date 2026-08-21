import * as Notifications from 'expo-notifications';
import { Linking } from 'react-native';

import {
  hasNotificationPermission,
  requestNotificationPermission,
  resolveNotificationsEnabled,
} from '../../lib/notification-permissions';

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
  beforeEach(() => {
    jest.spyOn(Linking, 'openSettings').mockResolvedValue();
  });

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

  it('deep-links to system settings instead of prompting once already denied', async () => {
    (Notifications.getPermissionsAsync as jest.Mock).mockResolvedValue({
      status: 'denied',
      canAskAgain: false,
    });

    expect(await requestNotificationPermission()).toBe(false);
    expect(Linking.openSettings).toHaveBeenCalled();
    expect(Notifications.requestPermissionsAsync).not.toHaveBeenCalled();
  });
});

describe('resolveNotificationsEnabled', () => {
  it('is false when turning notifications off, without touching the OS', async () => {
    expect(await resolveNotificationsEnabled(false)).toBe(false);
    expect(Notifications.getPermissionsAsync).not.toHaveBeenCalled();
  });

  it('requests permission when turning notifications on, and reflects the outcome', async () => {
    (Notifications.getPermissionsAsync as jest.Mock).mockResolvedValue({
      status: 'undetermined',
      canAskAgain: true,
    });
    (Notifications.requestPermissionsAsync as jest.Mock).mockResolvedValue({ status: 'granted' });

    expect(await resolveNotificationsEnabled(true)).toBe(true);
  });
});
