import { useEffect, useRef } from 'react';
import { Animated, Easing, StyleSheet } from 'react-native';
import Svg, { Defs, Ellipse, LinearGradient, Path, Stop } from 'react-native-svg';

import { useOscillation } from '../hooks/useOscillation';

// Scalloped bell margin.
const BELL =
  'M 3 32 C 3 14, 15 3, 28 3 C 41 3, 53 14, 53 32 C 47 28, 43 34, 37 31 C 31 34, 25 34, 19 31 C 13 34, 9 28, 3 32 Z';

const WIDTH = 56;
const HEIGHT = 80;

// Jet propulsion is asymmetric: a jellyfish squeezes its bell in a short, sharp
// contraction that fires it forward, then spends far longer refilling while it
// coasts and sinks. A symmetric oscillation can't express that, so the cycle is
// built from two differently-eased halves.
const CONTRACT_MS = 340;
const RECOVER_MS = 1460;
// How far the burst carries it, in design units before scaling.
const BURST = 13;
// The tentacles are dragged along a beat behind the bell that pulls them.
const TENTACLE_LAG_MS = 130;

/**
 * Drives one propulsion cycle. `bell` runs 0 (relaxed) -> 1 (fully contracted);
 * `lift` runs 0 (bottom of the cycle) -> 1 (top of the burst).
 */
function usePropulsion(startDelayMs = 0) {
  const bell = useRef(new Animated.Value(0)).current;
  const lift = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.parallel([
          Animated.timing(bell, {
            toValue: 1,
            duration: CONTRACT_MS,
            easing: Easing.out(Easing.quad),
            useNativeDriver: true,
          }),
          // Decelerating rise: all the thrust lands at the start of the squeeze.
          Animated.timing(lift, {
            toValue: 1,
            duration: CONTRACT_MS,
            easing: Easing.out(Easing.cubic),
            useNativeDriver: true,
          }),
        ]),
        Animated.parallel([
          Animated.timing(bell, {
            toValue: 0,
            duration: RECOVER_MS,
            easing: Easing.inOut(Easing.sin),
            useNativeDriver: true,
          }),
          // Hangs at the apex, then sinks away — the opposite curve to the burst.
          Animated.timing(lift, {
            toValue: 0,
            duration: RECOVER_MS,
            easing: Easing.in(Easing.quad),
            useNativeDriver: true,
          }),
        ]),
      ]),
    );

    // Both loops share a period, so delaying the start holds the lag constant
    // instead of letting the tentacles drift out of phase over time.
    const timer = setTimeout(() => loop.start(), startDelayMs);
    return () => {
      clearTimeout(timer);
      loop.stop();
    };
  }, [bell, lift, startDelayMs]);

  return { bell, lift };
}

export function Jellyfish({ size = 72 }: { size?: number }) {
  const scale = size / WIDTH;
  const height = HEIGHT * scale;

  const { bell, lift } = usePropulsion();
  const trailing = usePropulsion(TENTACLE_LAG_MS);
  const wobble = useOscillation(2300);

  // Contracting draws the bell margin inward, so it narrows and goes bullet-shaped
  // as it expels water — the burst therefore lands at its narrowest, not its widest.
  const bellWidth = bell.interpolate({ inputRange: [0, 1], outputRange: [1.06, 0.88] });
  const bellHeight = bell.interpolate({ inputRange: [0, 1], outputRange: [0.94, 1.08] });
  const glow = bell.interpolate({ inputRange: [0, 1], outputRange: [0.4, 0.9] });
  const burst = lift.interpolate({ inputRange: [0, 1], outputRange: [0, -BURST * scale] });

  // Water drag stretches the tentacles straight as the bell pulls away from them.
  const tentacleStretch = trailing.bell.interpolate({
    inputRange: [0, 1],
    outputRange: [1, 1.14],
  });
  const tentacleSway = wobble.interpolate({ inputRange: [0, 1], outputRange: ['-5deg', '5deg'] });

  return (
    <Animated.View
      accessibilityLabel="Jellyfish"
      style={[{ width: size, height }, { transform: [{ translateY: burst }] }]}
      pointerEvents="none"
    >
      <Animated.View
        style={[
          styles.part,
          { transformOrigin: 'center 38%' },
          { transform: [{ scaleY: tentacleStretch }, { rotate: tentacleSway }] },
        ]}
      >
        <Svg width={size} height={height} viewBox="0 0 56 80">
          <Path d="M 15 31 C 12 44, 18 52, 14 64 C 12 70, 14 74, 16 77" stroke="#c4b5fd" strokeWidth={2.2} fill="none" strokeLinecap="round" opacity={0.75} />
          <Path d="M 24 33 C 22 46, 27 56, 23 70 C 22 74, 23 77, 25 79" stroke="#a5f3fc" strokeWidth={2.4} fill="none" strokeLinecap="round" opacity={0.8} />
          <Path d="M 33 33 C 35 46, 30 56, 34 70 C 35 74, 34 77, 32 79" stroke="#c4b5fd" strokeWidth={2.4} fill="none" strokeLinecap="round" opacity={0.8} />
          <Path d="M 42 31 C 45 44, 39 52, 43 64 C 45 70, 43 74, 41 77" stroke="#a5f3fc" strokeWidth={2.2} fill="none" strokeLinecap="round" opacity={0.75} />
          {/* Short frilly oral arms under the bell. */}
          <Path d="M 20 31 C 19 38, 22 42, 20 48" stroke="#f5d0fe" strokeWidth={1.6} fill="none" strokeLinecap="round" opacity={0.7} />
          <Path d="M 37 31 C 38 38, 35 42, 37 48" stroke="#f5d0fe" strokeWidth={1.6} fill="none" strokeLinecap="round" opacity={0.7} />
        </Svg>
      </Animated.View>

      <Animated.View
        style={[
          styles.part,
          { transformOrigin: 'center 34%' },
          { transform: [{ scaleX: bellWidth }, { scaleY: bellHeight }] },
        ]}
      >
        <Svg width={size} height={height} viewBox="0 0 56 80">
          <Defs>
            <LinearGradient id="jellyfish-bell" x1="0" y1="0" x2="0" y2="1">
              <Stop offset="0" stopColor="#f5d0fe" stopOpacity={0.95} />
              <Stop offset="0.6" stopColor="#a78bfa" stopOpacity={0.75} />
              <Stop offset="1" stopColor="#67e8f9" stopOpacity={0.55} />
            </LinearGradient>
          </Defs>

          <Path d={BELL} fill="url(#jellyfish-bell)" stroke="#ddd6fe" strokeWidth={1.6} strokeLinejoin="round" />
          {/* Inner bell markings. */}
          <Ellipse cx={28} cy={20} rx={13} ry={9} fill="none" stroke="#f8fafc" strokeWidth={1.2} opacity={0.5} />
          <Ellipse cx={22} cy={14} rx={4} ry={3} fill="#ffffff" opacity={0.5} />
        </Svg>
      </Animated.View>

      {/* Bioluminescent halo, brightest at full contraction. */}
      <Animated.View style={[styles.part, { opacity: glow }]}>
        <Svg width={size} height={height} viewBox="0 0 56 80">
          <Path d={BELL} fill="none" stroke="#e9d5ff" strokeWidth={5} strokeLinejoin="round" opacity={0.35} />
        </Svg>
      </Animated.View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  part: {
    position: 'absolute',
    top: 0,
    left: 0,
  },
});
