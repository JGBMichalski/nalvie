import { Animated, StyleSheet, View } from 'react-native';
import Svg, { Circle, Defs, Ellipse, LinearGradient, Path, Stop } from 'react-native-svg';

import { useOscillation } from '../hooks/useOscillation';

// Head, snout and trunk as one tapering silhouette: thick through the chest,
// narrowing toward where the tail takes over.
const TRUNK =
  'M 22 7 C 27 4, 31 7, 32 11 L 42 14 L 43 16.5 L 32 16 C 31 19, 32 22, 33 26 C 35 32, 33 40, 28 46 L 22 49 C 19 44, 18 36, 19 28 C 20 20, 19 12, 22 7 Z';
const CORONET = 'M 18.5 9 C 17.5 3, 21 1.5, 22 6 C 23.5 1, 26.5 3, 25 8.5 Z';
const DORSAL = 'M 19 27 C 12 29, 9.5 35, 12 42 C 15.5 42, 18.5 38, 19.5 33 Z';
const PECTORAL = 'M 30 18.5 C 34.5 19.5, 35.5 25, 32 27.5 C 29 26, 28 21.5, 30 18.5 Z';

const OUTLINE = '#5a3f14';
const WIDTH = 46;
const HEIGHT = 78;

/**
 * The prehensile tail, built as discrete armour segments shrinking along a spiral.
 * Drawing it as a single stroked curve is what made the old version read as a bent
 * sausage — the segmentation and the taper are the whole silhouette.
 */
const TAIL_SEGMENTS = Array.from({ length: 10 }, (_, index) => {
  const t = index / 9;
  const angle = -1.75 + t * 4.7;
  const radius = 14 * (1 - 0.6 * t);
  return {
    cx: 23 + radius * Math.cos(angle),
    cy: 60.5 + radius * Math.sin(angle),
    r: 4.7 - 2.9 * t,
  };
});

export function Seahorse({ size = 72 }: { size?: number }) {
  const scale = size / WIDTH;
  const height = HEIGHT * scale;

  // The dorsal fin beats almost too fast to track — that blur is the whole point.
  const fin = useOscillation(110);
  const pectoral = useOscillation(150);
  const hover = useOscillation(2600);
  const curl = useOscillation(3400);

  const finRotation = fin.interpolate({ inputRange: [0, 1], outputRange: ['-9deg', '9deg'] });
  const finOpacity = fin.interpolate({ inputRange: [0, 1], outputRange: [0.6, 0.95] });
  const pectoralRotation = pectoral.interpolate({
    inputRange: [0, 1],
    outputRange: ['-14deg', '10deg'],
  });
  const bob = hover.interpolate({ inputRange: [0, 1], outputRange: [-5, 5] });
  const sway = curl.interpolate({ inputRange: [0, 1], outputRange: ['-3deg', '3deg'] });
  // The tail grips and releases, tightening the coil slightly.
  const tailCurl = curl.interpolate({ inputRange: [0, 1], outputRange: ['5deg', '-7deg'] });

  return (
    <Animated.View
      accessibilityLabel="Seahorse"
      style={[{ width: size, height }, { transform: [{ translateY: bob }, { rotate: sway }] }]}
      pointerEvents="none"
    >
      {/* Dorsal fin sits behind the trunk it attaches to. */}
      <Animated.View
        style={[
          styles.part,
          { transformOrigin: '41% 45%' },
          { transform: [{ rotate: finRotation }], opacity: finOpacity },
        ]}
      >
        <Svg width={size} height={height} viewBox="0 0 46 78">
          <Path d={DORSAL} fill="#ffe9a8" stroke={OUTLINE} strokeWidth={1.2} strokeLinejoin="round" />
          <Path d="M 18 29 C 14 33, 13 38, 14 41 M 18.5 32 C 16 35, 15.5 38, 16 40" stroke={OUTLINE} strokeWidth={0.9} fill="none" opacity={0.45} />
        </Svg>
      </Animated.View>

      <Animated.View
        style={[styles.part, { transformOrigin: '46% 60%' }, { transform: [{ rotate: tailCurl }] }]}
      >
        <Svg width={size} height={height} viewBox="0 0 46 78">
          <Defs>
            <LinearGradient id="seahorse-tail" x1="0" y1="0" x2="0" y2="1">
              <Stop offset="0" stopColor="#f0b445" />
              <Stop offset="1" stopColor="#c9761f" />
            </LinearGradient>
          </Defs>
          {TAIL_SEGMENTS.map((segment, index) => (
            <Circle
              key={index}
              cx={segment.cx}
              cy={segment.cy}
              r={segment.r}
              fill="url(#seahorse-tail)"
              stroke={OUTLINE}
              strokeWidth={1.3}
            />
          ))}
        </Svg>
      </Animated.View>

      <View style={styles.part}>
        <Svg width={size} height={height} viewBox="0 0 46 78">
          <Defs>
            <LinearGradient id="seahorse-body" x1="0.1" y1="0" x2="0.9" y2="1">
              <Stop offset="0" stopColor="#ffe08a" />
              <Stop offset="0.5" stopColor="#f5b942" />
              <Stop offset="1" stopColor="#d1811f" />
            </LinearGradient>
          </Defs>

          <Path d={CORONET} fill="#f5b942" stroke={OUTLINE} strokeWidth={1.3} strokeLinejoin="round" />
          <Path d={TRUNK} fill="url(#seahorse-body)" stroke={OUTLINE} strokeWidth={1.8} strokeLinejoin="round" />

          {/* Bony ring plates banding the trunk. */}
          <Path d="M 20 21 C 24 22.5, 28 22.5, 31.5 21" stroke={OUTLINE} strokeWidth={1.1} fill="none" opacity={0.4} />
          <Path d="M 19 28 C 23 29.5, 28 29.5, 33 28" stroke={OUTLINE} strokeWidth={1.1} fill="none" opacity={0.4} />
          <Path d="M 19 35 C 23 36.5, 28 36.5, 34 35" stroke={OUTLINE} strokeWidth={1.1} fill="none" opacity={0.4} />
          <Path d="M 20 42 C 23 43.5, 27 43.5, 31 41.5" stroke={OUTLINE} strokeWidth={1.1} fill="none" opacity={0.4} />
          {/* Spiny ridge down the back. */}
          <Path d="M 19.5 24 L 17.5 23 M 18.5 31 L 16.5 30 M 18.5 38 L 16.5 37.5" stroke={OUTLINE} strokeWidth={1.1} strokeLinecap="round" opacity={0.5} />

          <Ellipse cx={27} cy={12} rx={3} ry={3.2} fill="#fdf6ec" stroke={OUTLINE} strokeWidth={1.2} />
          <Circle cx={27.6} cy={12} r={1.5} fill="#2c1c05" />
        </Svg>
      </View>

      <Animated.View
        style={[
          styles.part,
          { transformOrigin: '65% 26%' },
          { transform: [{ rotate: pectoralRotation }] },
        ]}
      >
        <Svg width={size} height={height} viewBox="0 0 46 78">
          <Path d={PECTORAL} fill="#ffe9a8" opacity={0.9} stroke={OUTLINE} strokeWidth={1.2} strokeLinejoin="round" />
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
