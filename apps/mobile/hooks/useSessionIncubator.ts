import { useEffect, useRef, useState } from 'react';
import type { FocusSession } from '@nalvie/core';

import type { SessionPhase } from './useSessionLoop';

export type IncubatorReleaseState = 'growing' | 'popping' | 'fading';

// How long the pop/fade animation gets to play before the incubator unmounts.
const POP_HOLD_MS = 550;
const FADE_HOLD_MS = 450;

/**
 * useSessionLoop clears `session` the instant a session ends. This hook
 * holds onto the last session across that transition and reports which
 * animation to run.
 */
export function useSessionIncubator(phase: SessionPhase, session: FocusSession | null) {
  const [visible, setVisible] = useState(false);
  const [releaseState, setReleaseState] = useState<IncubatorReleaseState>('growing');
  const heldSession = useRef<FocusSession | null>(null);
  const prevPhase = useRef<SessionPhase>(phase);

  if (session) heldSession.current = session;

  useEffect(() => {
    const prevWasInProgress = prevPhase.current === 'in-progress';
    prevPhase.current = phase;

    if (phase === 'in-progress') {
      setVisible(true);
      setReleaseState('growing');
      return;
    }

    if (!prevWasInProgress) return; // only react to a transition out of an active session

    if (phase === 'toast-complete') {
      setReleaseState('popping');
      const timeout = setTimeout(() => setVisible(false), POP_HOLD_MS);
      return () => clearTimeout(timeout);
    }

    if (phase === 'toast-failed') {
      setReleaseState('fading');
      const timeout = setTimeout(() => setVisible(false), FADE_HOLD_MS);
      return () => clearTimeout(timeout);
    }
  }, [phase]);

  return { visible, session: heldSession.current, releaseState };
}
