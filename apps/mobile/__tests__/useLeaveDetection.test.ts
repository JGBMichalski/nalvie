import { renderHook } from '@testing-library/react-native';
import { GRACE_PERIOD_MS } from '@nalvie/core';

import { useLeaveDetection } from '../hooks/useLeaveDetection';
import { makeFakeAppState } from './test-utils/fake-app-state';
import { makeFakeLockSignal } from './test-utils/fake-lock-signal';

describe('useLeaveDetection', () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('does not fire when the app returns before the grace period elapses', () => {
    const onGraceExpired = jest.fn();
    const appState = makeFakeAppState();
    renderHook(() => useLeaveDetection(true, onGraceExpired, appState as never));

    appState.emit('background');
    jest.advanceTimersByTime(GRACE_PERIOD_MS - 1000);
    appState.emit('active');

    expect(onGraceExpired).not.toHaveBeenCalled();
  });

  it('fires once the app has been away longer than the grace period', () => {
    const onGraceExpired = jest.fn();
    const appState = makeFakeAppState();
    renderHook(() => useLeaveDetection(true, onGraceExpired, appState as never));

    appState.emit('background');
    jest.advanceTimersByTime(GRACE_PERIOD_MS + 1000);
    appState.emit('active');

    expect(onGraceExpired).toHaveBeenCalledTimes(1);
  });

  it('fires the moment the grace period elapses while still backgrounded, without waiting for a return to foreground', () => {
    const onGraceExpired = jest.fn();
    const appState = makeFakeAppState();
    renderHook(() => useLeaveDetection(true, onGraceExpired, appState as never));

    appState.emit('background');
    jest.advanceTimersByTime(GRACE_PERIOD_MS);

    expect(onGraceExpired).toHaveBeenCalledTimes(1); // no 'active' event needed
  });

  it('does not double-fire if the app later returns to foreground after already firing in the background', () => {
    const onGraceExpired = jest.fn();
    const onGraceClockChange = jest.fn();
    const appState = makeFakeAppState();
    renderHook(() => useLeaveDetection(true, onGraceExpired, appState as never, onGraceClockChange));

    appState.emit('background');
    jest.advanceTimersByTime(GRACE_PERIOD_MS);
    expect(onGraceExpired).toHaveBeenCalledTimes(1);
    expect(onGraceClockChange).toHaveBeenLastCalledWith(false); // clock stopped itself once it fired

    jest.advanceTimersByTime(60_000);
    appState.emit('active');

    expect(onGraceExpired).toHaveBeenCalledTimes(1);
  });

  it('treats iOS "inactive" the same as "background"', () => {
    const onGraceExpired = jest.fn();
    const appState = makeFakeAppState();
    renderHook(() => useLeaveDetection(true, onGraceExpired, appState as never));

    appState.emit('inactive');
    jest.advanceTimersByTime(GRACE_PERIOD_MS + 1000);
    appState.emit('active');

    expect(onGraceExpired).toHaveBeenCalledTimes(1);
  });

  it('does nothing when disabled', () => {
    const onGraceExpired = jest.fn();
    const appState = makeFakeAppState();
    renderHook(() => useLeaveDetection(false, onGraceExpired, appState as never));

    appState.emit('background');
    jest.advanceTimersByTime(GRACE_PERIOD_MS + 1000);
    appState.emit('active');

    expect(onGraceExpired).not.toHaveBeenCalled();
  });

  it('reports backgrounding transitions via onBackgroundChange, regardless of grace expiry', () => {
    const onGraceExpired = jest.fn();
    const onBackgroundChange = jest.fn();
    const appState = makeFakeAppState();
    renderHook(() => useLeaveDetection(true, onGraceExpired, appState as never, onBackgroundChange));

    appState.emit('background');
    expect(onBackgroundChange).toHaveBeenLastCalledWith(true);

    jest.advanceTimersByTime(GRACE_PERIOD_MS - 1000); // returns within the grace period
    appState.emit('active');
    expect(onBackgroundChange).toHaveBeenLastCalledWith(false);
    expect(onGraceExpired).not.toHaveBeenCalled();
  });

  it('calls onBackgroundChange(false) when detection is disabled while backgrounded', () => {
    const onGraceExpired = jest.fn();
    const onBackgroundChange = jest.fn();
    const appState = makeFakeAppState();
    const { rerender } = renderHook<void, { enabled: boolean }>(
      ({ enabled }) => useLeaveDetection(enabled, onGraceExpired, appState as never, onBackgroundChange),
      { initialProps: { enabled: true } },
    );

    appState.emit('background');
    expect(onBackgroundChange).toHaveBeenLastCalledWith(true);

    rerender({ enabled: false }); // e.g. the user paused
    expect(onBackgroundChange).toHaveBeenLastCalledWith(false);
  });

  it('does not fire a pending proactive timeout after being disabled mid-background (e.g. the user paused)', () => {
    const onGraceExpired = jest.fn();
    const appState = makeFakeAppState();
    const { rerender } = renderHook<void, { enabled: boolean }>(
      ({ enabled }) => useLeaveDetection(enabled, onGraceExpired, appState as never),
      { initialProps: { enabled: true } },
    );

    appState.emit('background');
    rerender({ enabled: false });
    jest.advanceTimersByTime(GRACE_PERIOD_MS + 1000);

    expect(onGraceExpired).not.toHaveBeenCalled();
  });

  describe('screen-lock gate', () => {
    it('does not fail the session when the screen locks and stays locked past the grace period', () => {
      const onGraceExpired = jest.fn();
      const onGraceClockChange = jest.fn();
      const appState = makeFakeAppState();
      const lockSignal = makeFakeLockSignal();
      renderHook(() =>
        useLeaveDetection(true, onGraceExpired, appState as never, onGraceClockChange, lockSignal),
      );

      lockSignal.lock();
      appState.emit('background');
      expect(onGraceClockChange).not.toHaveBeenCalledWith(true); // exempt — never started
      jest.advanceTimersByTime(GRACE_PERIOD_MS + 60_000);
      appState.emit('active'); // still locked, returning directly — no unlock-while-backgrounded

      expect(onGraceExpired).not.toHaveBeenCalled();
    });

    it('retroactively cancels the grace clock if the lock signal arrives after backgrounding', () => {
      const onGraceExpired = jest.fn();
      const onGraceClockChange = jest.fn();
      const appState = makeFakeAppState();
      const lockSignal = makeFakeLockSignal();
      renderHook(() =>
        useLeaveDetection(true, onGraceExpired, appState as never, onGraceClockChange, lockSignal),
      );

      appState.emit('background'); // grace clock starts (ordering isn't guaranteed)
      expect(onGraceClockChange).toHaveBeenLastCalledWith(true);
      lockSignal.lock(); // cancels it retroactively
      expect(onGraceClockChange).toHaveBeenLastCalledWith(false);

      jest.advanceTimersByTime(GRACE_PERIOD_MS + 60_000);
      appState.emit('active');

      expect(onGraceExpired).not.toHaveBeenCalled();
    });

    it('restarts the grace clock fresh if unlocked while still backgrounded', () => {
      const onGraceExpired = jest.fn();
      const appState = makeFakeAppState();
      const lockSignal = makeFakeLockSignal();
      renderHook(() => useLeaveDetection(true, onGraceExpired, appState as never, undefined, lockSignal));

      lockSignal.lock();
      appState.emit('background'); // exempt while locked
      jest.advanceTimersByTime(60_000);
      lockSignal.unlock(); // user actively did something — fresh clock starts now
      jest.advanceTimersByTime(GRACE_PERIOD_MS + 1000);
      appState.emit('active');

      expect(onGraceExpired).toHaveBeenCalledTimes(1);
    });

    it('behaves exactly like today when the lock signal never fires (genuine app-switch, or passcode-less iOS)', () => {
      const onGraceExpired = jest.fn();
      const appState = makeFakeAppState();
      const lockSignal = makeFakeLockSignal();
      renderHook(() => useLeaveDetection(true, onGraceExpired, appState as never, undefined, lockSignal));

      appState.emit('background');
      jest.advanceTimersByTime(GRACE_PERIOD_MS + 1000);
      appState.emit('active');

      expect(onGraceExpired).toHaveBeenCalledTimes(1);
    });
  });
});
