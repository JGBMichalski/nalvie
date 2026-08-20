import { Animated, StyleSheet, View } from 'react-native';
import Svg, { Defs, Ellipse, LinearGradient, Path, Stop } from 'react-native-svg';

import { useOscillation } from '../hooks/useOscillation';

const BODY =
  'M 4 22 C 4 12, 14 6, 26 6 C 40 6, 49 13, 50 22 C 49 31, 40 38, 26 38 C 14 38, 4 32, 4 22 Z';
const DORSAL = 'M 14 9 C 22 -2, 34 0, 40 10 Z';
// A fancy goldfish's veil tail hangs in two lobes rather than one blade.
const TAIL_UPPER = 'M 27 22 C 19 11, 9 2, 2 5 C 7 13, 10 18, 26 23 Z';
const TAIL_LOWER = 'M 27 22 C 19 33, 9 42, 2 39 C 7 31, 10 26, 26 21 Z';

const OUTLINE = '#5c2109';

const ASPECT = 76 / 44;

export function Goldfish({ size = 72 }: { size?: number }) {
  const height = size / ASPECT;
  // A big-bodied fancy goldfish is languid — everything is slower and wider
  // than the smaller fish in the tank.
  const sweep = useOscillation(760);
  // The lower lobe trails the upper one, so the veil never moves as one rigid piece.
  const trail = useOscillation(940);
  const swim = useOscillation(3200);

  const upperRotation = sweep.interpolate({ inputRange: [0, 1], outputRange: ['-15deg', '15deg'] });
  const lowerRotation = trail.interpolate({ inputRange: [0, 1], outputRange: ['-19deg', '11deg'] });
  const bob = swim.interpolate({ inputRange: [0, 1], outputRange: [-4, 4] });
  const tilt = swim.interpolate({ inputRange: [0, 1], outputRange: ['3deg', '-3deg'] });

  const tailLobe = (d: string, gradientId: string) => (
    <Svg width={size * (30 / 76)} height={height} viewBox="0 0 30 44">
      <Defs>
        <LinearGradient id={gradientId} x1="1" y1="0" x2="0" y2="0">
          <Stop offset="0" stopColor="#ff9f1c" stopOpacity={0.95} />
          <Stop offset="1" stopColor="#ffd7a0" stopOpacity={0.6} />
        </LinearGradient>
      </Defs>
      <Path
        d={d}
        fill={`url(#${gradientId})`}
        stroke={OUTLINE}
        strokeWidth={1.8}
        strokeLinejoin="round"
      />
    </Svg>
  );

  return (
    <Animated.View
      accessibilityLabel="Goldfish"
      style={[
        { width: size, height },
        styles.fish,
        { transform: [{ translateY: bob }, { rotate: tilt }] },
      ]}
    >
      <View style={styles.tailStack} pointerEvents="none">
        <Animated.View style={[styles.tail, { transform: [{ rotate: lowerRotation }] }]}>
          {tailLobe(TAIL_LOWER, 'goldfish-veil-lower')}
        </Animated.View>
        <Animated.View
          style={[styles.tail, styles.tailOverlay, { transform: [{ rotate: upperRotation }] }]}
        >
          {tailLobe(TAIL_UPPER, 'goldfish-veil-upper')}
        </Animated.View>
      </View>

      <View style={styles.body} pointerEvents="none">
        <Svg width={size * (52 / 76)} height={height} viewBox="0 0 52 44">
          <Defs>
            <LinearGradient id="goldfish-body" x1="0" y1="0" x2="0.3" y2="1">
              <Stop offset="0" stopColor="#ffe08a" />
              <Stop offset="0.45" stopColor="#ffa32e" />
              <Stop offset="1" stopColor="#e4551f" />
            </LinearGradient>
          </Defs>

          <Path d={DORSAL} fill="#ff9f1c" stroke={OUTLINE} strokeWidth={1.8} strokeLinejoin="round" />
          <Path d="M 18 35 C 21 43, 29 43, 32 34 Z" fill="#ff9f1c" stroke={OUTLINE} strokeWidth={1.8} strokeLinejoin="round" />

          <Path d={BODY} fill="url(#goldfish-body)" stroke={OUTLINE} strokeWidth={2.2} strokeLinejoin="round" />

          {/* Scale arcs along the flank. */}
          <Path d="M 16 14 C 20 18, 20 26, 16 30" stroke="#ffe6bd" strokeWidth={1.3} fill="none" opacity={0.55} />
          <Path d="M 25 12 C 30 17, 30 27, 25 32" stroke="#ffe6bd" strokeWidth={1.3} fill="none" opacity={0.5} />
          <Path d="M 34 12 C 39 17, 39 27, 34 32" stroke="#ffe6bd" strokeWidth={1.3} fill="none" opacity={0.4} />

          <Path d="M 24 25 C 31 25, 35 29, 32 33 C 27 33, 24 29, 24 25 Z" fill="#ff8c1a" stroke={OUTLINE} strokeWidth={1.7} strokeLinejoin="round" />

          {/* Fancy goldfish have a pronounced, slightly protruding eye. */}
          <Ellipse cx={42} cy={18} rx={4.6} ry={4.8} fill="#fdf6ec" stroke={OUTLINE} strokeWidth={1.6} />
          <Ellipse cx={43} cy={18} rx={2.4} ry={2.6} fill="#2b1206" />
          <Ellipse cx={41.6} cy={16.6} rx={1} ry={1.1} fill="#ffffff" />
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
  tailStack: {
    justifyContent: 'center',
  },
  tail: {
    transformOrigin: 'right center',
  },
  tailOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  body: {
    marginLeft: -7,
  },
});
