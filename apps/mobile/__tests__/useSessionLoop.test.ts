import { act, renderHook } from '@testing-library/react-native';
import { GRACE_PERIOD_MS, MAX_PAUSE_MS, MIN_SESSION_MINUTES } from '@nalvie/core';
import * as Notifications from 'expo-notifications';

import { createInMemorySessionRepository } from '../lib/in-memory-session-repository';
import { resetSettingsRepositoryForTests, settingsRepository } from '../lib/repository';
import { DEFAULT_SETTINGS } from '../lib/default-settings';
import { useSessionLoop } from '../hooks/useSessionLoop';
import { makeFakeAppState } from './test-utils/fake-app-state';

jest.mock('expo-notifications', () => ({
  getPermissionsAsync: jest.fn(),
  requestPermissionsAsync: jest.fn(),
  scheduleNotificationAsync: jest.fn(),
  cancelScheduledNotificationAsync: jest.fn(),
  cancelAllScheduledNotificationsAsync: jest.fn(),
  SchedulableTriggerInputTypes: { DATE: 'date' },
}));

describe('useSessionLoop', () => {
  beforeEach(() => {
    jest.useFakeTimers();
    jest.clearAllMocks();
    resetSettingsRepositoryForTests();
    (Notifications.getPermissionsAsync as jest.Mock).mockResolvedValue({ status: 'granted' });
    (Notifications.scheduleNotificationAsync as jest.Mock).mockResolvedValue('scheduled-id');
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('starts idle', async () => {
    const repo = createInMemorySessionRepository();
    const { result } = renderHook(() => useSessionLoop(repo));
    await act(async () => {}); // flush the mount-time finalize+refresh microtasks
    expect(result.current.phase).toBe('idle');
    expect(result.current.session).toBeNull();
  });

  it('runs a full session to completion and awards an item', async () => {
    const repo = createInMemorySessionRepository();
    const { result } = renderHook(() => useSessionLoop(repo));
    await act(async () => {}); // flush the mount-time finalize+refresh microtasks
    expect(result.current.phase).toBe('idle');

    await act(async () => {
      await result.current.startSession(MIN_SESSION_MINUTES, 'clownfish');
    });
    expect(result.current.phase).toBe('in-progress');
    expect(result.current.session?.plannedDurationMinutes).toBe(MIN_SESSION_MINUTES);

    await act(async () => {
      jest.advanceTimersByTime(MIN_SESSION_MINUTES * 60_000 + 1000);
      await Promise.resolve();
    });

    expect(result.current.phase).toBe('toast-complete');
    expect(result.current.toastMessage).toMatch(/Unlocked:/);
    expect(result.current.session).toBeNull();
    expect(await repo.listTankItems()).toHaveLength(1);

    await act(async () => {
      jest.advanceTimersByTime(3000);
    });
    expect(result.current.phase).toBe('idle');
  });

  it('adds a second instance of the same species rather than overwriting the first', async () => {
    const repo = createInMemorySessionRepository();
    const { result } = renderHook(() => useSessionLoop(repo));
    await act(async () => {});

    await act(async () => {
      await result.current.startSession(MIN_SESSION_MINUTES, 'clownfish');
    });
    await act(async () => {
      jest.advanceTimersByTime(MIN_SESSION_MINUTES * 60_000 + 1000);
      await Promise.resolve();
    });
    await act(async () => {
      jest.advanceTimersByTime(3000);
    });
    expect(result.current.phase).toBe('idle');

    await act(async () => {
      await result.current.startSession(MIN_SESSION_MINUTES, 'clownfish');
    });
    await act(async () => {
      jest.advanceTimersByTime(MIN_SESSION_MINUTES * 60_000 + 1000);
      await Promise.resolve();
    });

    const items = await repo.listTankItems();
    expect(items).toHaveLength(2);
    expect(items.every((item) => item.speciesId === 'clownfish')).toBe(true);
    expect(new Set(items.map((item) => item.id)).size).toBe(2); // distinct instance ids
  });

  it('does not complete the session while paused, even past the planned duration', async () => {
    const repo = createInMemorySessionRepository();
    const { result } = renderHook(() => useSessionLoop(repo));
    await act(async () => {}); // flush the mount-time finalize+refresh microtasks
    expect(result.current.phase).toBe('idle');

    await act(async () => {
      await result.current.startSession(MIN_SESSION_MINUTES, 'clownfish');
    });

    act(() => result.current.togglePause());
    expect(result.current.isPaused).toBe(true);

    await act(async () => {
      jest.advanceTimersByTime(MIN_SESSION_MINUTES * 60_000 + 5000);
    });

    expect(result.current.phase).toBe('in-progress');
    expect(result.current.session).not.toBeNull();
  });

  it('caps the paused duration credited back at MAX_PAUSE_MS', async () => {
    const repo = createInMemorySessionRepository();
    const { result } = renderHook(() => useSessionLoop(repo));
    await act(async () => {}); // flush the mount-time finalize+refresh microtasks
    expect(result.current.phase).toBe('idle');

    await act(async () => {
      await result.current.startSession(MIN_SESSION_MINUTES, 'clownfish');
    });

    act(() => result.current.togglePause());
    jest.advanceTimersByTime(MAX_PAUSE_MS + 60_000); // paused way past the cap
    act(() => result.current.togglePause()); // resume

    expect(result.current.session?.pausedMs).toBe(MAX_PAUSE_MS);
    expect(result.current.hasUsedPause).toBe(true);
  });

  it('only allows pause to be used once per session', async () => {
    const repo = createInMemorySessionRepository();
    const { result } = renderHook(() => useSessionLoop(repo));
    await act(async () => {}); // flush the mount-time finalize+refresh microtasks
    expect(result.current.phase).toBe('idle');

    await act(async () => {
      await result.current.startSession(MIN_SESSION_MINUTES, 'clownfish');
    });

    act(() => result.current.togglePause());
    act(() => result.current.togglePause()); // resume, pause now "used"
    const pausedMsAfterFirstUse = result.current.session?.pausedMs;

    act(() => result.current.togglePause()); // attempt a second pause — should no-op
    expect(result.current.isPaused).toBe(false);
    expect(result.current.session?.pausedMs).toBe(pausedMsAfterFirstUse);
  });

  it('does not fail the session when the app is backgrounded while deliberately paused', async () => {
    const repo = createInMemorySessionRepository();
    const appState = makeFakeAppState();
    const { result } = renderHook(() => useSessionLoop(repo, appState as never));
    await act(async () => {});

    await act(async () => {
      await result.current.startSession(MIN_SESSION_MINUTES, 'clownfish');
    });
    act(() => result.current.togglePause());
    expect(result.current.isPaused).toBe(true);

    await act(async () => {
      appState.emit('background');
      jest.advanceTimersByTime(GRACE_PERIOD_MS + 5000);
      appState.emit('active');
    });

    expect(result.current.phase).toBe('in-progress');
    expect(result.current.session).not.toBeNull();
  });

  it('does fail the session when backgrounded past the grace period while actively focusing', async () => {
    const repo = createInMemorySessionRepository();
    const appState = makeFakeAppState();
    const { result } = renderHook(() => useSessionLoop(repo, appState as never));
    await act(async () => {});

    await act(async () => {
      await result.current.startSession(MIN_SESSION_MINUTES, 'clownfish');
    });

    await act(async () => {
      appState.emit('background');
      jest.advanceTimersByTime(GRACE_PERIOD_MS + 5000);
      appState.emit('active');
    });

    expect(result.current.phase).toBe('toast-failed');
    expect(result.current.toastMessage).toMatch(/no reward this time/);
  });

  describe('session-result notifications (Ticket 08)', () => {
    beforeEach(async () => {
      await settingsRepository.saveSettings({ ...DEFAULT_SETTINGS, notificationsEnabled: true });
    });

    it('schedules a completed notification at session start when notifications are enabled', async () => {
      const repo = createInMemorySessionRepository();
      const { result } = renderHook(() => useSessionLoop(repo));
      await act(async () => {});

      await act(async () => {
        await result.current.startSession(MIN_SESSION_MINUTES, 'clownfish');
      });

      expect(Notifications.scheduleNotificationAsync).toHaveBeenCalledTimes(1);
      const call = (Notifications.scheduleNotificationAsync as jest.Mock).mock.calls[0][0];
      expect(call.content.body).toMatch(/tank grew/i);
    });

    it('does not schedule anything when notifications are disabled', async () => {
      await settingsRepository.saveSettings({ ...DEFAULT_SETTINGS, notificationsEnabled: false });
      const repo = createInMemorySessionRepository();
      const { result } = renderHook(() => useSessionLoop(repo));
      await act(async () => {});

      await act(async () => {
        await result.current.startSession(MIN_SESSION_MINUTES, 'clownfish');
      });

      expect(Notifications.scheduleNotificationAsync).not.toHaveBeenCalled();
    });

    it('cancels the completed notification once the session resolves in the foreground', async () => {
      const repo = createInMemorySessionRepository();
      const { result } = renderHook(() => useSessionLoop(repo));
      await act(async () => {});

      await act(async () => {
        await result.current.startSession(MIN_SESSION_MINUTES, 'clownfish');
      });

      await act(async () => {
        jest.advanceTimersByTime(MIN_SESSION_MINUTES * 60_000 + 1000);
        await Promise.resolve();
      });

      expect(Notifications.cancelScheduledNotificationAsync).toHaveBeenCalledWith('scheduled-id');
    });

    it('schedules a failed-session notification while backgrounded, and cancels it on return', async () => {
      const repo = createInMemorySessionRepository();
      const appState = makeFakeAppState();
      const { result } = renderHook(() => useSessionLoop(repo, appState as never));
      await act(async () => {});

      await act(async () => {
        await result.current.startSession(MIN_SESSION_MINUTES, 'clownfish');
      });
      (Notifications.scheduleNotificationAsync as jest.Mock).mockClear();

      await act(async () => {
        appState.emit('background');
      });
      expect(Notifications.scheduleNotificationAsync).toHaveBeenCalledTimes(1);
      const call = (Notifications.scheduleNotificationAsync as jest.Mock).mock.calls[0][0];
      expect(call.content.body).toMatch(/stepped away too long/i);

      await act(async () => {
        jest.advanceTimersByTime(GRACE_PERIOD_MS - 1000);
        appState.emit('active');
      });

      expect(Notifications.cancelScheduledNotificationAsync).toHaveBeenCalledWith('scheduled-id');
      expect(result.current.phase).toBe('in-progress'); // returned within the grace period
    });

    it('cancels the completed notification while paused, since paused time no longer counts toward it', async () => {
      const repo = createInMemorySessionRepository();
      const { result } = renderHook(() => useSessionLoop(repo));
      await act(async () => {});

      await act(async () => {
        await result.current.startSession(MIN_SESSION_MINUTES, 'clownfish');
      });
      (Notifications.cancelScheduledNotificationAsync as jest.Mock).mockClear();

      act(() => result.current.togglePause());

      expect(Notifications.cancelScheduledNotificationAsync).toHaveBeenCalledWith('scheduled-id');
    });

    it('reschedules the completed notification with an adjusted time after a pause credits time back', async () => {
      const repo = createInMemorySessionRepository();
      const { result } = renderHook(() => useSessionLoop(repo));
      await act(async () => {});

      await act(async () => {
        await result.current.startSession(MIN_SESSION_MINUTES, 'clownfish');
      });
      (Notifications.scheduleNotificationAsync as jest.Mock).mockClear();

      act(() => result.current.togglePause());
      jest.advanceTimersByTime(30_000);
      await act(async () => {
        result.current.togglePause(); // resume
        await Promise.resolve();
      });

      expect(Notifications.cancelScheduledNotificationAsync).toHaveBeenCalledWith('scheduled-id');
      expect(Notifications.scheduleNotificationAsync).toHaveBeenCalledTimes(1);
    });
  });
});
