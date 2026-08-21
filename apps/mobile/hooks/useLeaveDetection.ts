import { useEffect, useRef } from 'react';
import { AppState, type AppStateStatus } from 'react-native';
import { GRACE_PERIOD_MS } from '@nalvie/core';

export type AppStateLike = Pick<typeof AppState, 'addEventListener'>;

/**
 * Backgrounding a session risks failing it, but a brief backgrounding
 * (notification swipe, phone call, permission dialog) shouldn't.
 * iOS can't distinguish "switched app" from "locked device"
 * from "system dialog", so background/inactive are treated identically here.
 */
export function useLeaveDetection(
  enabled: boolean,
  onGraceExpired: () => void,
  appState: AppStateLike = AppState,
  onBackgroundChange?: (backgrounded: boolean) => void,
): void {
  const backgroundedAtRef = useRef<number | null>(null);
  const onGraceExpiredRef = useRef(onGraceExpired);
  onGraceExpiredRef.current = onGraceExpired;
  const onBackgroundChangeRef = useRef(onBackgroundChange);
  onBackgroundChangeRef.current = onBackgroundChange;

  useEffect(() => {
    if (!enabled) {
      if (backgroundedAtRef.current !== null) onBackgroundChangeRef.current?.(false);
      backgroundedAtRef.current = null;
      return;
    }

    function handleChange(status: AppStateStatus) {
      if (status === 'active') {
        if (backgroundedAtRef.current !== null) {
          const awayMs = Date.now() - backgroundedAtRef.current;
          backgroundedAtRef.current = null;
          onBackgroundChangeRef.current?.(false);
          if (awayMs > GRACE_PERIOD_MS) onGraceExpiredRef.current();
        }
      } else if (backgroundedAtRef.current === null) {
        backgroundedAtRef.current = Date.now();
        onBackgroundChangeRef.current?.(true);
      }
    }

    const subscription = appState.addEventListener('change', handleChange);
    return () => subscription.remove();
  }, [enabled, appState]);
}

