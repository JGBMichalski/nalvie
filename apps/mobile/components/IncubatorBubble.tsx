import { useEffect, useRef } from 'react';
import { Animated, Easing, StyleSheet, View } from 'react-native';
import type { FocusSession } from '@nalvie/core';

import type { IncubatorReleaseState } from '../hooks/useSessionIncubator';
import { GrowingFish } from './GrowingFish';

const POP_DURATION_MS = 500;
const FADE_DURATION_MS = 420;
const BUBBLE_SIZE = 104;

export function IncubatorBubble({
  session,
  isPaused,
  releaseState,
}: {
  session: FocusSession;
  isPaused: boolean;
  releaseState: IncubatorReleaseState;
}) {
  const pop = useRef(new Animated.Value(0)).current; // 0 = intact, 1 = fully popped
  const fade = useRef(new Animated.Value(1)).current; // 1 = visible, 0 = dissolved

  useEffect(() => {
    if (releaseState === 'popping') {
      Animated.timing(pop, {
        toValue: 1,
        duration: POP_DURATION_MS,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }).start();
    } else if (releaseState === 'fading') {
      Animated.timing(fade, {
        toValue: 0,
        duration: FADE_DURATION_MS,
        easing: Easing.out(Easing.ease),
        useNativeDriver: true,
      }).start();
    }
  }, [releaseState, pop, fade]);

  const bubbleScale = pop.interpolate({ inputRange: [0, 1], outputRange: [1, 1.4] });
  const bubbleOpacity = pop.interpolate({ inputRange: [0, 0.6, 1], outputRange: [1, 0.5, 0] });
  const shockwaveScale = pop.interpolate({ inputRange: [0, 1], outputRange: [0.7, 2.4] });
  const shockwaveOpacity = pop.interpolate({ inputRange: [0, 0.25, 1], outputRange: [0, 0.55, 0] });
  // The occupant fades out near the very end of the pop
  const contentOpacity = pop.interpolate({ inputRange: [0, 0.75, 1], outputRange: [1, 1, 0] });

  return (
    <View style={styles.container} pointerEvents="none">
      <Animated.View style={[styles.centered, { opacity: fade }]}>
        {releaseState === 'popping' && (
          <Animated.View
            style={[styles.shockwave, { opacity: shockwaveOpacity, transform: [{ scale: shockwaveScale }] }]}
          />
        )}
        <Animated.View style={[styles.bubble, { opacity: bubbleOpacity, transform: [{ scale: bubbleScale }] }]} />
        <Animated.View style={{ opacity: contentOpacity }}>
          <GrowingFish session={session} isPaused={isPaused} />
        </Animated.View>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: 'center',
    justifyContent: 'center',
  },
  centered: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  bubble: {
    position: 'absolute',
    width: BUBBLE_SIZE,
    height: BUBBLE_SIZE,
    borderRadius: BUBBLE_SIZE / 2,
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.35)',
  },
  shockwave: {
    position: 'absolute',
    width: BUBBLE_SIZE,
    height: BUBBLE_SIZE,
    borderRadius: BUBBLE_SIZE / 2,
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.6)',
  },
});
