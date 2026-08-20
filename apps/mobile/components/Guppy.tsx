import { Animated, StyleSheet, View } from 'react-native';
import Svg, { Circle, Defs, Ellipse, LinearGradient, Path, Stop } from 'react-native-svg';

import { useOscillation } from '../hooks/useOscillation';

const BODY =
  'M 4 20 C 6 12, 15 8, 26 9 C 36 10, 44 14, 46 20 C 44 26, 36 30, 26 31 C 15 32, 6 28, 4 20 Z';
// A guppy's defining feature: an oversized flowing fan tail.
const TAIL = 'M 26 20 C 19 4, 8 -1, 2 5 C 8 13, 8 27, 2 35 C 8 41, 19 36, 26 20 Z';
const DORSAL = 'M 14 11 C 20 3, 29 4, 33 10 Z';
const OUTLINE = '#141726';

const ASPECT = 70 / 40;

export function Guppy({ size = 72 }: { size?: number }) {
  const height = size / ASPECT;
  // Guppies flutter that big tail faster than a clownfish flaps.
  const flutter = useOscillation(300);
  const swim = useOscillation(1900);

  const tailRotation = flutter.interpolate({
    inputRange: [0, 1],
    outputRange: ['-20deg', '20deg'],
  });
  const tailStretch = flutter.interpolate({ inputRange: [0, 1], outputRange: [0.88, 1.06] });
  const bob = swim.interpolate({ inputRange: [0, 1], outputRange: [-3, 3] });
  const tilt = swim.interpolate({ inputRange: [0, 1], outputRange: ['2.5deg', '-2.5deg'] });

  return (
    <Animated.View
      accessibilityLabel="Guppy"
      style={[
        { width: size, height },
        styles.fish,
        { transform: [{ translateY: bob }, { rotate: tilt }] },
      ]}
    >
      <Animated.View
        style={[
          styles.tail,
          { transform: [{ rotate: tailRotation }, { scaleY: tailStretch }] },
        ]}
        pointerEvents="none"
      >
        <Svg width={size * (28 / 70)} height={height} viewBox="0 0 28 40">
          <Defs>
            <LinearGradient id="guppy-tail" x1="1" y1="0" x2="0" y2="0">
              <Stop offset="0" stopColor="#8b5cf6" />
              <Stop offset="0.55" stopColor="#f0709a" />
              <Stop offset="1" stopColor="#ffb454" />
            </LinearGradient>
          </Defs>
          <Path
            d={TAIL}
            fill="url(#guppy-tail)"
            stroke={OUTLINE}
            strokeWidth={2}
            strokeLinejoin="round"
          />
          {/* Fin rays, hinting at the translucent webbing. */}
          <Path d="M 24 18 C 17 12, 10 7, 5 5" stroke="#ffe6c2" strokeWidth={1.2} fill="none" opacity={0.7} />
          <Path d="M 24 22 C 17 27, 10 32, 5 35" stroke="#ffe6c2" strokeWidth={1.2} fill="none" opacity={0.7} />
        </Svg>
      </Animated.View>

      <View style={styles.body} pointerEvents="none">
        <Svg width={size * (48 / 70)} height={height} viewBox="0 0 48 40">
          <Defs>
            <LinearGradient id="guppy-body" x1="0" y1="0" x2="1" y2="0">
              <Stop offset="0" stopColor="#c084fc" />
              <Stop offset="0.6" stopColor="#5eead4" />
              <Stop offset="1" stopColor="#22d3ee" />
            </LinearGradient>
          </Defs>

          <Path d={DORSAL} fill="#f0709a" stroke={OUTLINE} strokeWidth={1.8} strokeLinejoin="round" />
          <Path d={BODY} fill="url(#guppy-body)" stroke={OUTLINE} strokeWidth={2} strokeLinejoin="round" />

          {/* Iridescent speckles. */}
          <Circle cx={18} cy={17} r={2.2} fill="#fef9c3" opacity={0.85} />
          <Circle cx={24} cy={23} r={1.6} fill="#fef9c3" opacity={0.7} />
          <Circle cx={13} cy={22} r={1.4} fill="#fef9c3" opacity={0.6} />

          <Path d="M 22 24 C 27 24, 30 27, 28 30 C 24 30, 22 27, 22 24 Z" fill="#f0709a" stroke={OUTLINE} strokeWidth={1.6} strokeLinejoin="round" />

          <Ellipse cx={38} cy={17} rx={3.4} ry={3.8} fill="#fdf6ec" stroke={OUTLINE} strokeWidth={1.4} />
          <Ellipse cx={39} cy={17} rx={1.7} ry={2} fill={OUTLINE} />
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
    marginLeft: -6,
  },
});
