/**
 * Local Expo Module: detects the device screen locking/unlocking.
 *
 * iOS: backed by Apple's protected-data lock/unlock notifications.
 * Android: backed by ACTION_SCREEN_OFF (lock) / ACTION_USER_PRESENT (unlock,
 * not ACTION_SCREEN_ON — that fires on any wake, including a glance at a
 * still-locked lock screen).
 *
 * See .scratch/screen-lock-safe-sessions/spec.md for the full design and
 * .scratch/screen-lock-safe-sessions/issues/08 and 09 for the per-platform
 * rationale.
 */
import { requireNativeModule, type EventSubscription } from 'expo-modules-core';

// expo-modules-core's own `NativeModule<TEventsMap>` type doesn't thread its
// generic through correctly (an upstream typing quirk), so this module
// defines its own minimal shape rather than fighting that type.
type ScreenLockSignalModule = {
  addListener(eventName: 'onLocked' | 'onUnlocked', listener: () => void): EventSubscription;
};

const nativeModule = requireNativeModule<ScreenLockSignalModule>('ScreenLockSignal');

export function addLockedListener(listener: () => void): EventSubscription {
  return nativeModule.addListener('onLocked', listener);
}

export function addUnlockedListener(listener: () => void): EventSubscription {
  return nativeModule.addListener('onUnlocked', listener);
}

