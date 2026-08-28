// Shared fake for the ScreenLockSignal native module, used by any test
// exercising the lock-aware leave-detection gate.
export function makeFakeLockSignal() {
  const lockedHandlers: (() => void)[] = [];
  const unlockedHandlers: (() => void)[] = [];
  return {
    addLockedListener: (handler: () => void) => {
      lockedHandlers.push(handler);
      return {
        remove: () => {
          const index = lockedHandlers.indexOf(handler);
          if (index !== -1) lockedHandlers.splice(index, 1);
        },
      };
    },
    addUnlockedListener: (handler: () => void) => {
      unlockedHandlers.push(handler);
      return {
        remove: () => {
          const index = unlockedHandlers.indexOf(handler);
          if (index !== -1) unlockedHandlers.splice(index, 1);
        },
      };
    },
    lock() {
      for (const handler of lockedHandlers) handler();
    },
    unlock() {
      for (const handler of unlockedHandlers) handler();
    },
  };
}
