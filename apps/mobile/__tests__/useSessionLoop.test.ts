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
  addNotificationReceivedListener: jest.fn(() => ({ remove: jest.fn() })),
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
    expect(result.current.toastMessage).toBe('A Clownfish has joined your tank!');
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

  it('says a species "joined your tank" (not "unlocked") for a repeat of an already-owned species', async () => {
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
    expect(result.current.toastMessage).toBe('A Clownfish has joined your tank!');
    await act(async () => {
      jest.advanceTimersByTime(3000);
    });

    await act(async () => {
      await result.current.startSession(MIN_SESSION_MINUTES, 'clownfish');
    });
    await act(async () => {
      jest.advanceTimersByTime(MIN_SESSION_MINUTES * 60_000 + 1000);
      await Promise.resolve();
    });

    expect(result.current.toastMessage).toBe('Another Clownfish joined your tank!');
    expect(result.current.toastMessage).not.toMatch(/Unlocked/);
  });

  it('reserves "Unlocked" for the first time a streak-gated rare species is awarded', async () => {
    const repo = createInMemorySessionRepository();
    const { result } = renderHook(() => useSessionLoop(repo));
    await act(async () => {});

    await act(async () => {
      await result.current.startSession(MIN_SESSION_MINUTES, 'sea-turtle');
    });
    await act(async () => {
      jest.advanceTimersByTime(MIN_SESSION_MINUTES * 60_000 + 1000);
      await Promise.resolve();
    });

    expect(result.current.toastMessage).toBe('Unlocked: Sea Turtle!');
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

  it('fails the session on the failed notification actually being delivered, not just a same-instant JS timer', async () => {
    // React Native's JS timers are known to be throttled/deprioritized once
    // backgrounded (facebook/react-native#21211, #23674) — so the delivered
    // notification (a native-bridge event, not a JS timer) is what must
    // reliably trigger the fail, independent of whether any setTimeout in
    // this process happens to fire.
    const repo = createInMemorySessionRepository();
    const appState = makeFakeAppState();
    let deliverFailedNotification: () => void = () => {};
    (Notifications.addNotificationReceivedListener as jest.Mock).mockImplementation((cb) => {
      deliverFailedNotification = () => cb({ request: { content: { data: { kind: 'session-failed' } } } });
      return { remove: jest.fn() };
    });
    const { result } = renderHook(() => useSessionLoop(repo, appState as never));
    await act(async () => {});

    await act(async () => {
      await result.current.startSession(MIN_SESSION_MINUTES, 'clownfish');
    });
    appState.emit('background'); // no jest.advanceTimersByTime at all — the JS timer never fires

    await act(async () => {
      deliverFailedNotification();
      await Promise.resolve();
      await Promise.resolve();
      await Promise.resolve();
    });

    expect(result.current.phase).toBe('toast-failed');
    const savedSessions = await repo.listSessions();
    expect(savedSessions[0].outcome).toBe('failed');
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
      // Two notifications fire on leaving: an immediate "will end soon" warning,
      // and the "already ended" one scheduled for the grace-period instant.
      expect(Notifications.scheduleNotificationAsync).toHaveBeenCalledTimes(2);
      const bodies = (Notifications.scheduleNotificationAsync as jest.Mock).mock.calls.map((call) => call[0].content.body);
      expect(bodies.some((body: string) => /will end in/i.test(body))).toBe(true);
      expect(bodies.some((body: string) => /stepped away too long/i.test(body))).toBe(true);

      await act(async () => {
        jest.advanceTimersByTime(GRACE_PERIOD_MS - 1000);
        appState.emit('active');
      });

      expect(Notifications.cancelScheduledNotificationAsync).toHaveBeenCalledWith('scheduled-id');
      expect(result.current.phase).toBe('in-progress'); // returned within the grace period
    });

    it('sends an immediate warning naming the grace period the moment leaving starts', async () => {
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

      const warningCall = (Notifications.scheduleNotificationAsync as jest.Mock).mock.calls.find((call) =>
        /will end in/i.test(call[0].content.body),
      );
      expect(warningCall[0].trigger).toBeNull(); // delivered immediately, not scheduled
    });

    it('lets the already-scheduled failed notification actually fire once the grace period elapses in the background, instead of cancelling it', async () => {
      const repo = createInMemorySessionRepository();
      const appState = makeFakeAppState();
      // Distinguish which notification got cancelled — the shared 'scheduled-id'
      // stub can't tell completed/failed apart.
      (Notifications.scheduleNotificationAsync as jest.Mock).mockImplementation(async (args) =>
        /stepped away too long/i.test(args.content.body) ? 'failed-id' : 'other-id',
      );
      const { result } = renderHook(() => useSessionLoop(repo, appState as never));
      await act(async () => {});

      await act(async () => {
        await result.current.startSession(MIN_SESSION_MINUTES, 'clownfish');
      });

      await act(async () => {
        appState.emit('background');
        jest.advanceTimersByTime(GRACE_PERIOD_MS); // grace expires while still backgrounded
        await Promise.resolve();
      });

      // The session is actually cancelled (failed) in the background, not just
      // left dangling until the user reopens the app...
      expect(result.current.session).toBeNull();
      const savedSessions = await repo.listSessions();
      expect(savedSessions[0].outcome).toBe('failed');
      // ...and the OS notification that was scheduled for exactly this moment
      // is left alone to actually be delivered, not cancelled out from under it.
      expect(Notifications.cancelScheduledNotificationAsync).not.toHaveBeenCalledWith('failed-id');
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

  describe('session-scoped ambience mute (Ticket 09)', () => {
    it('starts unmuted', async () => {
      const repo = createInMemorySessionRepository();
      const { result } = renderHook(() => useSessionLoop(repo));
      await act(async () => {});

      expect(result.current.isSessionMuted).toBe(false);
    });

    it('toggles on and off', async () => {
      const repo = createInMemorySessionRepository();
      const { result } = renderHook(() => useSessionLoop(repo));
      await act(async () => {});

      await act(async () => {
        await result.current.startSession(MIN_SESSION_MINUTES, 'clownfish');
      });

      act(() => result.current.toggleSessionMute());
      expect(result.current.isSessionMuted).toBe(true);

      act(() => result.current.toggleSessionMute());
      expect(result.current.isSessionMuted).toBe(false);
    });

    it('resets to unmuted for a new session, even if the previous one ended muted', async () => {
      const repo = createInMemorySessionRepository();
      const { result } = renderHook(() => useSessionLoop(repo));
      await act(async () => {});

      await act(async () => {
        await result.current.startSession(MIN_SESSION_MINUTES, 'clownfish');
      });
      act(() => result.current.toggleSessionMute());
      expect(result.current.isSessionMuted).toBe(true);

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

      expect(result.current.isSessionMuted).toBe(false);
    });
  });
});
