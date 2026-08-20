import { Animated, StyleSheet, View } from 'react-native';
import Svg, { Circle, Defs, LinearGradient, Path, Stop } from 'react-native-svg';

import { useOscillation } from '../hooks/useOscillation';

const CARAPACE =
  'M 40 14 C 43 20, 40 26, 34 29 C 26 32, 15 31, 7 27 C 12 25, 14 22, 14 19 C 16 13, 22 9, 30 9 C 36 9, 39 11, 40 14 Z';
const TAIL_FAN = 'M 22 24 C 16 17, 8 15, 2 19 C 6 24, 6 28, 2 33 C 9 35, 16 30, 22 26 Z';

const OUTLINE = '#8a2f22';

const WIDTH = 72;
const HEIGHT = 40;

export function Shrimp({ size = 72 }: { size?: number }) {
  const scale = size / WIDTH;
  const height = HEIGHT * scale;

  // A shrimp's tail flick is the fastest motion in the tank.
  const flick = useOscillation(190);
  const antennae = useOscillation(1700);
  const drift = useOscillation(2400);
  // Swimmerets ripple out of step with the tail.
  const legs = useOscillation(260);

  const tailRotation = flick.interpolate({ inputRange: [0, 1], outputRange: ['-9deg', '11deg'] });
  const antennaeRotation = antennae.interpolate({
    inputRange: [0, 1],
    outputRange: ['-7deg', '5deg'],
  });
  const bob = drift.interpolate({ inputRange: [0, 1], outputRange: [-2, 2] });
  const tilt = drift.interpolate({ inputRange: [0, 1], outputRange: ['-3deg', '3deg'] });
  const legSway = legs.interpolate({ inputRange: [0, 1], outputRange: ['-8deg', '8deg'] });

  return (
    <Animated.View
      accessibilityLabel="Shrimp"
      style={[{ width: size, height }, { transform: [{ translateY: bob }, { rotate: tilt }] }]}
      pointerEvents="none"
    >
      <Animated.View
        style={[
          styles.part,
          { left: 0, width: 22 * scale, transformOrigin: 'right center' },
          { transform: [{ rotate: tailRotation }] },
        ]}
      >
        <Svg width={22 * scale} height={height} viewBox="0 0 22 40">
          <Path d={TAIL_FAN} fill="#ff9d8a" opacity={0.85} stroke={OUTLINE} strokeWidth={1.6} strokeLinejoin="round" />
        </Svg>
      </Animated.View>

      <Animated.View
        style={[
          styles.part,
          { left: 18 * scale, width: 44 * scale, transformOrigin: 'center top' },
          { transform: [{ rotate: legSway }] },
        ]}
      >
        <Svg width={44 * scale} height={height} viewBox="0 0 44 40">
          {/* Swimmerets, tucked under the abdomen. */}
          <Path d="M 14 27 L 12 34 M 19 29 L 18 36 M 24 30 L 24 37 M 29 30 L 30 36" stroke={OUTLINE} strokeWidth={1.4} strokeLinecap="round" opacity={0.8} />
        </Svg>
      </Animated.View>

      <View style={[styles.part, { left: 18 * scale, width: 44 * scale }]}>
        <Svg width={44 * scale} height={height} viewBox="0 0 44 40">
          <Defs>
            <LinearGradient id="shrimp-body" x1="1" y1="0" x2="0" y2="1">
              <Stop offset="0" stopColor="#ff8a6b" />
              <Stop offset="1" stopColor="#ffc9b3" stopOpacity={0.9} />
            </LinearGradient>
          </Defs>

          <Path d={CARAPACE} fill="url(#shrimp-body)" stroke={OUTLINE} strokeWidth={1.8} strokeLinejoin="round" />
          {/* Abdominal segment banding. */}
          <Path d="M 30 10 C 28 16, 27 24, 28 30" stroke={OUTLINE} strokeWidth={1.2} fill="none" opacity={0.5} />
          <Path d="M 23 10 C 21 16, 20 25, 21 31" stroke={OUTLINE} strokeWidth={1.2} fill="none" opacity={0.5} />
          <Path d="M 16 12 C 14 18, 14 25, 15 30" stroke={OUTLINE} strokeWidth={1.2} fill="none" opacity={0.5} />
          {/* Rostrum. */}
          <Path d="M 40 13 L 51 8" stroke={OUTLINE} strokeWidth={1.6} strokeLinecap="round" />
          <Circle cx={37} cy={16} r={2.2} fill="#3a1008" />
        </Svg>
      </View>

      <Animated.View
        style={[
          styles.part,
          { left: 44 * scale, width: 28 * scale, transformOrigin: 'left center' },
          { transform: [{ rotate: antennaeRotation }] },
        ]}
      >
        <Svg width={28 * scale} height={height} viewBox="0 0 28 40">
          <Path d="M 0 14 C 9 8, 17 5, 27 3" stroke="#ffb9a5" strokeWidth={1.4} fill="none" strokeLinecap="round" />
          <Path d="M 0 17 C 9 15, 18 14, 27 11" stroke="#ffb9a5" strokeWidth={1.2} fill="none" strokeLinecap="round" opacity={0.8} />
        </Svg>
      </Animated.View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  part: {
    position: 'absolute',
    top: 0,
  },
});
