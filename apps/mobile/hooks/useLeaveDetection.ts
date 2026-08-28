import { useEffect, useRef } from 'react';
import { AppState, type AppStateStatus } from 'react-native';
import { GRACE_PERIOD_MS } from '@nalvie/core';

import { useScreenLockSignal, type ScreenLockSignalLike } from './useScreenLockSignal';

export type AppStateLike = Pick<typeof AppState, 'addEventListener'>;
export type { ScreenLockSignalLike };

/**
 * Backgrounding a session risks failing it, but a brief backgrounding
 * (notification swipe, phone call, permission dialog) shouldn't.
 */
export function useLeaveDetection(
  enabled: boolean,
  onGraceExpired: () => void,
  appState: AppStateLike = AppState,
  onGraceClockChange?: (running: boolean) => void,
  lockSignal?: ScreenLockSignalLike,
): void {
  const backgroundedAtRef = useRef<number | null>(null);
  const isBackgroundRef = useRef(false);
  const onGraceExpiredRef = useRef(onGraceExpired);
  onGraceExpiredRef.current = onGraceExpired;
  const onGraceClockChangeRef = useRef(onGraceClockChange);
  onGraceClockChangeRef.current = onGraceClockChange;

  function startGraceClock() {
    backgroundedAtRef.current = Date.now();
    onGraceClockChangeRef.current?.(true);
  }

  function stopGraceClock() {
    if (backgroundedAtRef.current === null) return;
    backgroundedAtRef.current = null;
    onGraceClockChangeRef.current?.(false);
  }

  // Lock signal arrived after backgrounding started
  const lockedRef = useScreenLockSignal(
    () => {
      if (isBackgroundRef.current) stopGraceClock();
    },
    // Unlocked but still backgrounded — the user actively did something
    // (checked another app, glanced and swiped away). Start a *fresh* clock
    // from this moment.
    () => {
      if (isBackgroundRef.current) startGraceClock();
    },
    lockSignal,
  );

  useEffect(() => {
    if (!enabled) {
      if (backgroundedAtRef.current !== null) onGraceClockChangeRef.current?.(false);
      backgroundedAtRef.current = null;
      isBackgroundRef.current = false;
      return;
    }

    function handleAppStateChange(status: AppStateStatus) {
      if (status === 'active') {
        isBackgroundRef.current = false;
        if (backgroundedAtRef.current !== null) {
          const awayMs = Date.now() - backgroundedAtRef.current;
          stopGraceClock();
          if (awayMs > GRACE_PERIOD_MS) onGraceExpiredRef.current();
        }
      } else if (!isBackgroundRef.current) {
        isBackgroundRef.current = true;
        // Locked already (or the lock signal arrives first) — exempt, no clock.
        if (!lockedRef.current) startGraceClock();
      }
    }

    const appSub = appState.addEventListener('change', handleAppStateChange);
    return () => appSub.remove();
    // eslint-disable-next-line react-hooks/exhaustive-deps -- lockedRef is a ref, intentionally excluded
  }, [enabled, appState]);
}
