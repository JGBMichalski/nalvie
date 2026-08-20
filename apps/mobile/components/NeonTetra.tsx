import { Animated, StyleSheet, View } from 'react-native';
import Svg, { Defs, Ellipse, LinearGradient, Path, Stop } from 'react-native-svg';

import { useOscillation } from '../hooks/useOscillation';

const AnimatedPath = Animated.createAnimatedComponent(Path);

const BODY =
  'M 3 16 C 6 9, 14 5, 24 5 C 34 5, 42 9, 45 16 C 42 23, 34 27, 24 27 C 14 27, 6 23, 3 16 Z';
// Forked caudal fin — the notch is what separates a tetra silhouette from a guppy fan.
const TAIL = 'M 17 16 L 2 3 L 7 16 L 2 29 Z';
const NEON_STRIPE = 'M 9 14 C 18 12, 30 12, 42 14';
const RED_STRIPE = 'M 20 20 C 28 21, 36 21, 43 19';

const OUTLINE = '#0d1b2a';
const NEON = '#3ff0ff';
const RED = '#ff3b52';

const ASPECT = 60 / 32;

export function NeonTetra({ size = 72 }: { size?: number }) {
  const height = size / ASPECT;
  // Tetras beat a small tail quickly rather than sweeping it.
  const beat = useOscillation(220);
  const swim = useOscillation(1500);
  const shimmer = useOscillation(1100);

  const tailRotation = beat.interpolate({ inputRange: [0, 1], outputRange: ['-13deg', '13deg'] });
  const bob = swim.interpolate({ inputRange: [0, 1], outputRange: [-2.5, 2.5] });
  const tilt = swim.interpolate({ inputRange: [0, 1], outputRange: ['2deg', '-2deg'] });
  const glow = shimmer.interpolate({ inputRange: [0, 1], outputRange: [0.25, 0.75] });
  const core = shimmer.interpolate({ inputRange: [0, 1], outputRange: [0.8, 1] });

  return (
    <Animated.View
      accessibilityLabel="Neon Tetra"
      style={[
        { width: size, height },
        styles.fish,
        { transform: [{ translateY: bob }, { rotate: tilt }] },
      ]}
    >
      <Animated.View
        style={[styles.tail, { transform: [{ rotate: tailRotation }] }]}
        pointerEvents="none"
      >
        <Svg width={size * (18 / 60)} height={height} viewBox="0 0 18 32">
          <Path d={TAIL} fill="#9fdfe8" opacity={0.75} stroke={OUTLINE} strokeWidth={1.6} strokeLinejoin="round" />
        </Svg>
      </Animated.View>

      <View style={styles.body} pointerEvents="none">
        <Svg width={size * (48 / 60)} height={height} viewBox="0 0 48 32">
          <Defs>
            <LinearGradient id="tetra-body" x1="0" y1="0" x2="0" y2="1">
              <Stop offset="0" stopColor="#cfeffa" stopOpacity={0.9} />
              <Stop offset="1" stopColor="#7fb8d6" stopOpacity={0.75} />
            </LinearGradient>
          </Defs>

          {/* Fins sit behind the translucent body. */}
          <Path d="M 18 8 C 23 2, 29 3, 31 8 Z" fill="#9fdfe8" opacity={0.8} stroke={OUTLINE} strokeWidth={1.4} strokeLinejoin="round" />
          <Path d="M 20 25 C 23 31, 29 31, 31 24 Z" fill="#9fdfe8" opacity={0.8} stroke={OUTLINE} strokeWidth={1.4} strokeLinejoin="round" />

          <Path d={BODY} fill="url(#tetra-body)" stroke={OUTLINE} strokeWidth={1.8} strokeLinejoin="round" />

          {/* The iridescent stripe: a soft wide halo under a bright core, both pulsing. */}
          <AnimatedPath d={NEON_STRIPE} stroke={NEON} strokeWidth={7} strokeLinecap="round" fill="none" opacity={glow} />
          <AnimatedPath d={NEON_STRIPE} stroke={NEON} strokeWidth={3.2} strokeLinecap="round" fill="none" opacity={core} />
          <AnimatedPath d={NEON_STRIPE} stroke="#eaffff" strokeWidth={1.2} strokeLinecap="round" fill="none" opacity={core} />

          <Path d={RED_STRIPE} stroke={RED} strokeWidth={5} strokeLinecap="round" fill="none" opacity={0.35} />
          <Path d={RED_STRIPE} stroke={RED} strokeWidth={2.6} strokeLinecap="round" fill="none" />

          <Ellipse cx={38} cy={12} rx={3} ry={3.2} fill="#fdf6ec" stroke={OUTLINE} strokeWidth={1.3} />
          <Ellipse cx={39} cy={12} rx={1.5} ry={1.7} fill={OUTLINE} />
        </Svg>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  fish: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  tail: {
    transformOrigin: 'right center',
  },
  body: {
    marginLeft: -5,
  },
});
