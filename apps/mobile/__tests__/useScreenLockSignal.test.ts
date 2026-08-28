import { renderHook } from '@testing-library/react-native';

import { useScreenLockSignal } from '../hooks/useScreenLockSignal';
import { makeFakeLockSignal } from './test-utils/fake-lock-signal';

describe('useScreenLockSignal', () => {
  it('starts unlocked', () => {
    const lockSignal = makeFakeLockSignal();
    const { result } = renderHook(() => useScreenLockSignal(undefined, undefined, lockSignal));

    expect(result.current.current).toBe(false);
  });

  it('flips the ref and fires onLocked when the native module reports a lock', () => {
    const onLocked = jest.fn();
    const lockSignal = makeFakeLockSignal();
    const { result } = renderHook(() => useScreenLockSignal(onLocked, undefined, lockSignal));

    lockSignal.lock();

    expect(result.current.current).toBe(true);
    expect(onLocked).toHaveBeenCalledTimes(1);
  });

  it('flips the ref back and fires onUnlocked when the native module reports an unlock', () => {
    const onUnlocked = jest.fn();
    const lockSignal = makeFakeLockSignal();
    const { result } = renderHook(() => useScreenLockSignal(undefined, onUnlocked, lockSignal));

    lockSignal.lock();
    lockSignal.unlock();

    expect(result.current.current).toBe(false);
    expect(onUnlocked).toHaveBeenCalledTimes(1);
  });

  it('unsubscribes on unmount', () => {
    const onLocked = jest.fn();
    const lockSignal = makeFakeLockSignal();
    const { unmount } = renderHook(() => useScreenLockSignal(onLocked, undefined, lockSignal));

    unmount();
    lockSignal.lock();

    expect(onLocked).not.toHaveBeenCalled();
  });
});
