import * as Notifications from 'expo-notifications';
import { Linking } from 'react-native';

export async function hasNotificationPermission(): Promise<boolean> {
  const { status } = await Notifications.getPermissionsAsync();
  return status === 'granted';
}

export async function requestNotificationPermission(): Promise<boolean> {
  const current = await Notifications.getPermissionsAsync();
  if (current.status === 'granted') return true;

  if (!current.canAskAgain) {
    await Linking.openSettings();
    return false;
  }

  const requested = await Notifications.requestPermissionsAsync();
  return requested.status === 'granted';
}

/**
 * What `Settings.notificationsEnabled` should become when the user flips the
 * Settings toggle.
 */
export async function resolveNotificationsEnabled(wantsEnabled: boolean): Promise<boolean> {
  if (!wantsEnabled) return false;
  return requestNotificationPermission();
}
