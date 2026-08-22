import { useCallback, useEffect, useRef, useState } from 'react';
import {
  UNLOCK_POOL,
  applyPause,
  completeSession,
  computeStreak,
  createSession,
  eligiblePoolItems,
  elapsedMs,
  failSession,
  finalizeInterruptedSession,
  hasUsedPause,
  isSessionComplete,
  unlockPoolItemToTankItem,
  type FocusSession,
  type SessionRepository,
  type StreakInfo,
  type TankItem,
} from '@nalvie/core';

import { useLeaveDetection, type AppStateLike } from './useLeaveDetection';
import {
  cancelAllPendingSessionNotifications,
  cancelCompletedNotification,
  cancelFailedNotification,
  cancelSessionNotifications,
  scheduleCompletedNotification,
  scheduleFailedNotification,
} from '../lib/session-notifications';

export type SessionPhase = 'idle' | 'in-progress' | 'toast-complete' | 'toast-failed';

const TICK_MS = 250;
const TOAST_DURATION_MS = 2500;

function createId(): string {
  return `session-${Date.now()}-${Math.floor(Math.random() * 1e6)}`;
}

/**
 * Orchestrates the Session & Tank core loop.
 */
export function useSessionLoop(repository: SessionRepository, appState?: AppStateLike) {
  const [phase, setPhase] = useState<SessionPhase>('idle');
  const [session, setSession] = useState<FocusSession | null>(null);
  const [unlockedItems, setUnlockedItems] = useState<TankItem[]>([]);
  const [completedSessions, setCompletedSessions] = useState(0);
  const [streak, setStreak] = useState<StreakInfo>({ current: 0, longest: 0 });
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [remainingMs, setRemainingMs] = useState(0);
  const [isPaused, setIsPaused] = useState(false);

  const pauseStartedAtRef = useRef<number | null>(null);

  const refreshFromRepository = useCallback(async () => {
    const [items, sessions] = await Promise.all([repository.listTankItems(), repository.listSessions()]);
    setUnlockedItems(items);
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
      await cancelSessionNotifications();
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

  const finishComplete = useCallback(
    async (current: FocusSession) => {
      const item = unlockPoolItemToTankItem(UNLOCK_POOL, current.selectedItemId, current.id, new Date().toISOString());
      const isFreshUnlock = !unlockedItems.some((existing) => existing.speciesId === item.speciesId);
      const poolItem = UNLOCK_POOL.find((poolEntry) => poolEntry.id === item.speciesId);
      const isStreakUnlock =
        isFreshUnlock && typeof poolItem?.eligibility === 'object' && 'minStreakDays' in poolItem.eligibility;

      await cancelSessionNotifications();
      await repository.saveTankItem(item);
      await repository.saveSession(completeSession(current));
      setSession(null);
      setToastMessage(
        isStreakUnlock
          ? `Unlocked: ${item.name}!`
          : isFreshUnlock
            ? `A ${item.name} has joined your tank!`
            : `Another ${item.name} joined your tank!`,
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
    // Notify only if still backgrounded when the grace period expires.
    (backgrounded) => {
      if (backgrounded) scheduleFailedNotification();
      else cancelFailedNotification();
    },
  );

  const startSession = useCallback(
    async (minutes: number, selectedItemId: string) => {
      const created = createSession(createId(), minutes, selectedItemId);
      await repository.saveSession(created);
      setSession(created);
      setRemainingMs(minutes * 60_000);
      setIsPaused(false);
      setPhase('in-progress');
      await scheduleCompletedNotification(created);
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
    } else if (!hasUsedPause(session)) {
      pauseStartedAtRef.current = Date.now();
      setIsPaused(true);
      // Paused time doesn't count toward completion
      void cancelCompletedNotification();
    }
  }, [session, isPaused]);

  return {
    phase,
    session,
    remainingMs,
    isPaused,
    hasUsedPause: session ? hasUsedPause(session) : false,
    unlockedItems,
    completedSessions,
    streak,
    eligibleItems: eligiblePoolItems(UNLOCK_POOL, { completedSessions, streak }),
    toastMessage,
    startSession,
    togglePause,
    refresh: refreshFromRepository,
  };
}
