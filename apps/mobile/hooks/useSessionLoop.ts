import { useCallback, useEffect, useRef, useState } from 'react';
import {
  UNLOCK_POOL,
  applyPause,
  canAfford,
  completeSession,
  completesAt,
  computeStreak,
  costFor,
  createSession,
  elapsedMs,
  failSession,
  finalizeInterruptedSession,
  hasUsedPause,
  isSessionComplete,
  pointsForSession,
  unlockPoolItemToTankItem,
  GRACE_PERIOD_MS,
  type FocusSession,
  type SessionRepository,
  type StreakInfo,
  type TankItem,
} from '@nalvie/core';

import { useLeaveDetection, type AppStateLike } from './useLeaveDetection';
import {
  addFailedNotificationDeliveredListener,
  cancelAllPendingSessionNotifications,
  cancelCompletedNotification,
  cancelFailedNotification,
  cancelSessionNotifications,
  scheduleCompletedNotification,
  scheduleFailedNotification,
  sendLeaveWarningNotification,
} from '../lib/session-notifications';
import { cancelNativeAudioStop, scheduleNativeAudioStop } from '../modules/screen-lock-signal';
import { settingsRepository } from '../lib/repository';

export type SessionPhase = 'idle' | 'in-progress' | 'toast-complete' | 'toast-failed';

const TICK_MS = 250;
const TOAST_DURATION_MS = 2500;

function createId(): string {
  return `session-${Date.now()}-${Math.floor(Math.random() * 1e6)}`;
}

async function adjustPointsBalance(delta: number): Promise<void> {
  const settings = await settingsRepository.getSettings();
  await settingsRepository.saveSettings({ ...settings, pointsBalance: settings.pointsBalance + delta });
}

/**
 * Orchestrates the Session & Tank core loop.
 */
export function useSessionLoop(repository: SessionRepository, appState?: AppStateLike) {
  const [phase, setPhase] = useState<SessionPhase>('idle');
  const [session, setSession] = useState<FocusSession | null>(null);
  const [unlockedItems, setUnlockedItems] = useState<TankItem[]>([]);
  const [unlockedSpeciesIds, setUnlockedSpeciesIds] = useState<Set<string>>(new Set());
  const [pointsBalance, setPointsBalance] = useState(0);
  const [completedSessions, setCompletedSessions] = useState(0);
  const [streak, setStreak] = useState<StreakInfo>({ current: 0, longest: 0 });
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [remainingMs, setRemainingMs] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [isSessionMuted, setIsSessionMuted] = useState(false);

  const pauseStartedAtRef = useRef<number | null>(null);

  const refreshFromRepository = useCallback(async () => {
    const [items, sessions, unlockedSpecies, settings] = await Promise.all([
      repository.listTankItems(),
      repository.listSessions(),
      repository.listUnlockedSpecies(),
      settingsRepository.getSettings(),
    ]);
    setUnlockedItems(items);
    setUnlockedSpeciesIds(new Set(unlockedSpecies.map((entry) => entry.speciesId)));
    setPointsBalance(settings.pointsBalance);
    setCompletedSessions(sessions.filter((s) => s.outcome === 'completed').length);
    setStreak(computeStreak(sessions));
  }, [repository]);

  // A session left in-progress by a force-quit is finalized as failed
  // before we trust any derived stats. Any notification scheduled for that
  // session can't be cancelled by id after a relaunch, so purge everything
  // scheduled rather than leave a stale one behind.
  useEffect(() => {
    finalizeInterruptedSession(repository)
      .then(cancelAllPendingSessionNotifications)
      .then(refreshFromRepository);
  }, [repository, refreshFromRepository]);

  const finishFail = useCallback(
    async (current: FocusSession) => {
      cancelNativeAudioStop();
      await cancelCompletedNotification();
      await repository.saveSession(failSession(current));
      setSession(null);
      setIsPaused(false);
      pauseStartedAtRef.current = null;
      setToastMessage('Session ended early — no reward this time');
      setPhase('toast-failed');
      await refreshFromRepository();
      setTimeout(() => setPhase('idle'), TOAST_DURATION_MS);
    },
    [repository, refreshFromRepository],
  );

  const sessionRef = useRef(session);
  sessionRef.current = session;
  useEffect(() => {
    const subscription = addFailedNotificationDeliveredListener(() => {
      if (sessionRef.current) finishFail(sessionRef.current);
    });
    return () => subscription.remove();
  }, [finishFail]);

  const finishComplete = useCallback(
    async (current: FocusSession) => {
      const item = unlockPoolItemToTankItem(UNLOCK_POOL, current.selectedItemId, current.id, new Date().toISOString());
      const isFreshUnlock = !unlockedItems.some((existing) => existing.speciesId === item.speciesId);

      await cancelSessionNotifications();
      cancelNativeAudioStop();
      await repository.saveTankItem(item);
      await repository.saveSession(completeSession(current));
      await adjustPointsBalance(pointsForSession(current.plannedDurationMinutes));
      setSession(null);
      setToastMessage(
        isFreshUnlock ? `A ${item.name} has joined your tank!` : `Another ${item.name} joined your tank!`,
      );
      setPhase('toast-complete');
      await refreshFromRepository();
      setTimeout(() => setPhase('idle'), TOAST_DURATION_MS);
    },
    [repository, refreshFromRepository, unlockedItems],
  );

  // Countdown + completion check, while in-progress and not paused
  const finishingRef = useRef(false);
  useEffect(() => {
    if (phase !== 'in-progress' || !session || isPaused) return;

    const interval = setInterval(() => {
      if (finishingRef.current) return; // finishComplete is still saving; don't re-trigger
      if (isSessionComplete(session)) {
        finishingRef.current = true;
        finishComplete(session).finally(() => {
          finishingRef.current = false;
        });
        return;
      }
      setRemainingMs(Math.max(0, session.plannedDurationMinutes * 60_000 - elapsedMs(session)));
    }, TICK_MS);

    return () => clearInterval(interval);
  }, [phase, session, isPaused, finishComplete]);

  // Disabled while paused
  useLeaveDetection(
    phase === 'in-progress' && !isPaused,
    () => {
      if (session) finishFail(session);
    },
    appState,
    // Notify only when the grace clock is actually running
    (graceClockRunning) => {
      if (graceClockRunning) {
        void sendLeaveWarningNotification();
        void scheduleFailedNotification();
        scheduleNativeAudioStop(Date.now() + GRACE_PERIOD_MS);
      } else {
        void cancelFailedNotification();
        if (sessionRef.current) scheduleNativeAudioStop(completesAt(sessionRef.current));
      }
    },
  );

  const startSession = useCallback(
    async (minutes: number, selectedItemId: string) => {
      const created = createSession(createId(), minutes, selectedItemId);
      await repository.saveSession(created);
      setSession(created);
      setRemainingMs(minutes * 60_000);
      setIsPaused(false);
      setIsSessionMuted(false);
      setPhase('in-progress');
      await scheduleCompletedNotification(created);
      scheduleNativeAudioStop(completesAt(created));
    },
    [repository],
  );

  const togglePause = useCallback(() => {
    if (!session) return;

    if (isPaused) {
      const pauseDurationMs = pauseStartedAtRef.current ? Date.now() - pauseStartedAtRef.current : 0;
      pauseStartedAtRef.current = null;
      const resumed = applyPause(session, pauseDurationMs);
      setSession(resumed);
      setIsPaused(false);
      void scheduleCompletedNotification(resumed);
      scheduleNativeAudioStop(completesAt(resumed));
    } else if (!hasUsedPause(session)) {
      pauseStartedAtRef.current = Date.now();
      setIsPaused(true);
      // Paused time doesn't count toward completion
      void cancelCompletedNotification();
      cancelNativeAudioStop();
    }
  }, [session, isPaused]);

  // Per-session-only: does not touch Settings.soundEnabled. The next
  // session starts unmuted again.
  const toggleSessionMute = useCallback(() => {
    setIsSessionMuted((muted) => !muted);
  }, []);

  const purchaseSpecies = useCallback(
    async (itemId: string) => {
      const item = UNLOCK_POOL.find((poolItem) => poolItem.id === itemId);
      if (!item || unlockedSpeciesIds.has(itemId) || !canAfford(pointsBalance, item)) return;

      await adjustPointsBalance(-costFor(item));
      await repository.saveUnlockedSpecies({ speciesId: itemId, unlockedAt: new Date().toISOString() });
      await refreshFromRepository();
    },
    [repository, refreshFromRepository, pointsBalance, unlockedSpeciesIds],
  );

  const clearTank = useCallback(async () => {
    await repository.clearTankItems();
    await refreshFromRepository();
  }, [repository, refreshFromRepository]);

  return {
    phase,
    session,
    remainingMs,
    isPaused,
    isSessionMuted,
    hasUsedPause: session ? hasUsedPause(session) : false,
    unlockedItems,
    unlockedSpeciesIds,
    pointsBalance,
    completedSessions,
    streak,
    toastMessage,
    startSession,
    togglePause,
    toggleSessionMute,
    purchaseSpecies,
    clearTank,
    refresh: refreshFromRepository,
  };
}
