/**
 * Local Expo Module: detects the device screen locking/unlocking, and drives
 * the native session lifecycle that has to keep running while the screen is
 * off.
 *
 * iOS: backed by Apple's protected-data lock/unlock notifications.
 * Android: backed by ACTION_SCREEN_OFF (lock) / ACTION_USER_PRESENT (unlock,
 * not ACTION_SCREEN_ON — that fires on any wake, including a glance at a
 * still-locked lock screen).
 */
import { requireNativeModule, type EventSubscription } from 'expo-modules-core';

// expo-modules-core's own `NativeModule<TEventsMap>` type doesn't thread its
// generic through correctly (an upstream typing quirk), so this module
// defines its own minimal shape rather than fighting that type.
type ScreenLockSignalModule = {
  addListener(eventName: 'onLocked' | 'onUnlocked', listener: () => void): EventSubscription;
  startSessionService(endAtMs: number, itemName: string): void;
  pauseSessionService(): void;
  resumeSessionService(endAtMs: number): void;
  expectFailureAt(endAtMs: number): void;
  stopSessionService(): void;
};

const nativeModule = requireNativeModule<ScreenLockSignalModule>('ScreenLockSignal');

export function addLockedListener(listener: () => void): EventSubscription {
  return nativeModule.addListener('onLocked', listener);
}

export function addUnlockedListener(listener: () => void): EventSubscription {
  return nativeModule.addListener('onUnlocked', listener);
}

/**
 * Hands the running session to native code for its whole duration. Everything
 * that has to happen on schedule while locked lives there: the live countdown
 * notification, stopping the ambient audio at `endAtMs`, and the completion
 * notification.
 *
 * `endAtMs` is an absolute epoch timestamp (`Date.now()`-style), matching
 * `completesAt` from core. `itemName` is baked in up front because the
 * completion notification is composed natively.
 *
 * Android is backed by a foreground service; iOS by a Live Activity plus a
 * native timer (the audio background mode keeps the process running).
 */
export function startSessionService(endAtMs: number, itemName: string): void {
  nativeModule.startSessionService(endAtMs, itemName);
}

/** Freezes the countdown and cancels the scheduled stop; no end time while paused. */
export function pauseSessionService(): void {
  nativeModule.pauseSessionService();
}

/** Resumes with a recomputed end time (pause time doesn't count toward completion). */
export function resumeSessionService(endAtMs: number): void {
  nativeModule.resumeSessionService(endAtMs);
}

/**
 * Brings the scheduled audio stop forward to the instant the leave-detection
 * grace period expires, and suppresses the completion notification.
 */
export function expectFailureAt(endAtMs: number): void {
  nativeModule.expectFailureAt(endAtMs);
}

/**
 * Tears down the session UI and cancels the scheduled stop. Called whenever a
 * session resolves in JS (completed or failed in-app) so the native side
 * doesn't also fire its own completion.
 */
export function stopSessionService(): void {
  nativeModule.stopSessionService();
}
