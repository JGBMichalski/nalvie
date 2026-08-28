import { useEffect, useRef } from 'react';

import { addLockedListener, addUnlockedListener } from '../modules/screen-lock-signal';

export type ScreenLockSignalLike = {
  addLockedListener: typeof addLockedListener;
  addUnlockedListener: typeof addUnlockedListener;
};

const defaultLockSignal: ScreenLockSignalLike = { addLockedListener, addUnlockedListener };

/**
 * Subscribes to the native ScreenLockSignal module and exposes the device's
 * current locked state as a ref.
 */
export function useScreenLockSignal(
  onLocked?: () => void,
  onUnlocked?: () => void,
  lockSignal: ScreenLockSignalLike = defaultLockSignal,
): React.RefObject<boolean> {
  const lockedRef = useRef(false);
  const onLockedRef = useRef(onLocked);
  onLockedRef.current = onLocked;
  const onUnlockedRef = useRef(onUnlocked);
  onUnlockedRef.current = onUnlocked;

  useEffect(() => {
    const lockedSub = lockSignal.addLockedListener(() => {
      lockedRef.current = true;
      onLockedRef.current?.();
    });
    const unlockedSub = lockSignal.addUnlockedListener(() => {
      lockedRef.current = false;
      onUnlockedRef.current?.();
    });
    return () => {
      lockedSub.remove();
      unlockedSub.remove();
    };
  }, [lockSignal]);

  return lockedRef;
}
