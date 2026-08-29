/**
 * Local Expo Module: detects the device screen locking/unlocking, and (on
 * Android) natively schedules audio to stop at a session's completion/failure
 * instant — see scheduleNativeAudioStop below for why this needs to be
 * native, not JS.
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
import { Platform } from 'react-native';
import { requireNativeModule, type EventSubscription } from 'expo-modules-core';

// expo-modules-core's own `NativeModule<TEventsMap>` type doesn't thread its
// generic through correctly (an upstream typing quirk), so this module
// defines its own minimal shape rather than fighting that type.
type ScreenLockSignalModule = {
  addListener(eventName: 'onLocked' | 'onUnlocked', listener: () => void): EventSubscription;
  // Android-only — see scheduleStopAudio's own doc comment below.
  scheduleStopAudio(timestampMs: number): void;
  cancelScheduledStopAudio(): void;
};

const nativeModule = requireNativeModule<ScreenLockSignalModule>('ScreenLockSignal');

export function addLockedListener(listener: () => void): EventSubscription {
  return nativeModule.addListener('onLocked', listener);
}

export function addUnlockedListener(listener: () => void): EventSubscription {
  return nativeModule.addListener('onUnlocked', listener);
}

/**
 * Android-only. Schedules a *native* alarm (AlarmManager, not a JS timer) that
 * directly commands expo-audio's foreground service to pause — confirmed
 * on-device that no JS runs at all while the screen is locked, so this is
 * the only mechanism that can actually silence audio in that state. `atMs`
 * is an absolute epoch timestamp (`Date.now()`-style), matching
 * scheduleFailedNotification/scheduleCompletedNotification's own math so all
 * three fire at the same instant.
 *
 * No iOS equivalent exists yet (no analogous native service to command
 * directly) — a no-op there.
 */
export function scheduleNativeAudioStop(atMs: number): void {
  if (Platform.OS !== 'android') return;
  nativeModule.scheduleStopAudio(atMs);
}

export function cancelNativeAudioStop(): void {
  if (Platform.OS !== 'android') return;
  nativeModule.cancelScheduledStopAudio();
}


