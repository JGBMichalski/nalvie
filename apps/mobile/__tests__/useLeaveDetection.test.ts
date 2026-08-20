import { renderHook } from '@testing-library/react-native';
import { GRACE_PERIOD_MS } from '@nalvie/core';

import { useLeaveDetection } from '../hooks/useLeaveDetection';
import { makeFakeAppState } from './test-utils/fake-app-state';

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
});
