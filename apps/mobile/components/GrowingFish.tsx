import { useEffect, useRef, useState } from 'react';
import { Animated, Easing } from 'react-native';
import { growthStage, sessionProgress, type FocusSession, type GrowthStage } from '@nalvie/core';

import { tankItemSizeScale } from '../lib/tank-item-visuals';
import { Egg } from './Egg';
import { TankItemVisual } from './TankItemVisual';

const TICK_MS = 250;

const EGG_SIZE = 28; // A small egg, roughly the size of a fresh hatchling.
// The fish's natural size in the tank (matches SWIMMER_SIZE in TankScene), the
// size it should reach by the time the session completes.
const TANK_SIZE = 72;
const HATCH_AT = 1 / 3;

const HATCH_SCALE = EGG_SIZE / TANK_SIZE; // Size when the egg hatches

function growthScaleFor(progress: number): number {
  const growth = Math.min(1, Math.max(0, (progress - HATCH_AT) / (1 - HATCH_AT)));
  return HATCH_SCALE + (1 - HATCH_SCALE) * growth;
}

/**
 * Starts with a small egg that hatches into a tiny fish. The fish will grow
 * to its full tank size by the time the session completes. While paused,
 * the fish holds its current size.
 */
export function GrowingFish({ session, isPaused }: { session: FocusSession; isPaused: boolean }) {
  const [progress, setProgress] = useState(() => sessionProgress(session));
  const fade = useRef(new Animated.Value(0.2)).current;
  const growthScale = useRef(new Animated.Value(growthScaleFor(sessionProgress(session)))).current;
  const prevStage = useRef<GrowthStage | null>(null);

  useEffect(() => {
    const update = () => setProgress(sessionProgress(session));
    update();
    if (isPaused) return;
    const interval = setInterval(update, TICK_MS);
    return () => clearInterval(interval);
  }, [session, isPaused]);

  const stage = growthStage(progress);

  useEffect(() => {
    const target = growthScaleFor(progress);
    if (isPaused) {
      growthScale.setValue(target);
      return;
    }
    const animation = Animated.timing(growthScale, {
      toValue: target,
      duration: TICK_MS,
      easing: Easing.linear,
      useNativeDriver: true,
    });
    animation.start();
    return () => animation.stop();
  }, [progress, isPaused, growthScale]);

  // Pop-and-settle when the fish hatches, so the moment reads as an event.
  useEffect(() => {
    if (prevStage.current === stage) return;
    prevStage.current = stage;
    fade.setValue(0.2);
    Animated.timing(fade, {
      toValue: 1,
      duration: 260,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();
  }, [stage, fade]);

  return stage === 'egg' ? (
    <Animated.View style={{ opacity: fade, transform: [{ scale: fade }] }}>
      <Egg size={EGG_SIZE} />
    </Animated.View>
  ) : (
    <Animated.View style={{ opacity: fade, transform: [{ scale: Animated.multiply(fade, growthScale) }] }}>
      <TankItemVisual itemId={session.selectedItemId} size={TANK_SIZE * tankItemSizeScale(session.selectedItemId)} />
    </Animated.View>
  );
}
