import { Animated, StyleSheet, View } from 'react-native';
import Svg, { ClipPath, Defs, Ellipse, G, Path } from 'react-native-svg';

import { useOscillation } from '../hooks/useOscillation';

const BODY = 'M 6 20 C 6 9, 22 4, 34 6 C 47 8, 55 14, 57 20 C 55 26, 47 32, 34 34 C 22 36, 6 31, 6 20 Z';
const TAIL = 'M 20 20 L 2 5 C 8 20, 8 20, 2 35 Z';

const ORANGE = '#f4712c';
const ORANGE_DARK = '#c8501a';
const BAND = '#fdf6ec';
const OUTLINE = '#1b1210';

// Aspect ratio of the whole fish (tail + body) in its design units.
const ASPECT = 72 / 40;

export function Clownfish({ size = 72 }: { size?: number }) {
  const height = size / ASPECT;
  const flap = useOscillation(420);
  const swim = useOscillation(2200);

  const tailRotation = flap.interpolate({ inputRange: [0, 1], outputRange: ['-16deg', '16deg'] });
  const bob = swim.interpolate({ inputRange: [0, 1], outputRange: [-4, 4] });
  const tilt = swim.interpolate({ inputRange: [0, 1], outputRange: ['3deg', '-3deg'] });

  return (
    <Animated.View
      accessibilityLabel="Clownfish"
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
        <Svg width={size * (20 / 72)} height={height} viewBox="0 0 20 40">
          <Path d={TAIL} fill={ORANGE_DARK} stroke={OUTLINE} strokeWidth={2.5} strokeLinejoin="round" />
        </Svg>
      </Animated.View>

      <View style={styles.body} pointerEvents="none">
        <Svg width={size * (60 / 72)} height={height} viewBox="0 0 60 40">
          <Defs>
            <ClipPath id="clownfish-body">
              <Path d={BODY} />
            </ClipPath>
          </Defs>

          {/* Dorsal + pelvic fins sit behind the body so their bases stay hidden. */}
          <Path d="M 16 10 C 24 -1, 38 1, 45 9 Z" fill={ORANGE_DARK} stroke={OUTLINE} strokeWidth={2} strokeLinejoin="round" />
          <Path d="M 20 30 C 24 39, 32 39, 36 31 Z" fill={ORANGE_DARK} stroke={OUTLINE} strokeWidth={2} strokeLinejoin="round" />

          <Path d={BODY} fill={ORANGE} />
          <G clipPath="url(#clownfish-body)">
            <Path d="M 17 0 L 12 40" stroke={OUTLINE} strokeWidth={9} />
            <Path d="M 34 0 L 29 40" stroke={OUTLINE} strokeWidth={9} />
            <Path d="M 52 0 L 49 40" stroke={OUTLINE} strokeWidth={8} />
            <Path d="M 17 0 L 12 40" stroke={BAND} strokeWidth={6} />
            <Path d="M 34 0 L 29 40" stroke={BAND} strokeWidth={6} />
            <Path d="M 52 0 L 49 40" stroke={BAND} strokeWidth={5} />
          </G>
          <Path d={BODY} fill="none" stroke={OUTLINE} strokeWidth={2.5} strokeLinejoin="round" />

          {/* Pectoral fin overlaps the flank. */}
          <Path d="M 26 21 C 32 20, 36 24, 34 29 C 29 29, 26 26, 26 21 Z" fill={ORANGE_DARK} stroke={OUTLINE} strokeWidth={2} strokeLinejoin="round" />

          <Ellipse cx={46} cy={17} rx={4} ry={4.4} fill={BAND} stroke={OUTLINE} strokeWidth={1.5} />
          <Ellipse cx={47} cy={17} rx={2} ry={2.4} fill={OUTLINE} />
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
    marginLeft: -8,
  },
});
