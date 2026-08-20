import { Animated, StyleSheet, View } from 'react-native';
import Svg, { ClipPath, Defs, Ellipse, G, LinearGradient, Path, Stop } from 'react-native-svg';

import { useOscillation } from '../hooks/useOscillation';

// Laterally compressed disc with a pointed snout at the right — the fish faces right,
// so every fin sweeps up-and-BACK toward the tail on the left.
const BODY =
  'M 12 46 C 12 34, 20 26, 31 26 C 41 26, 48 33, 51 41 L 55 44 L 51 47 C 49 57, 41 66, 31 66 C 20 66, 12 58, 12 46 Z';
// Base runs along the fish's back, tip rakes back over the tail.
const DORSAL = 'M 45 31 C 40 20, 26 8, 12 3 C 7 14, 9 32, 13 44 C 22 34, 34 29, 45 31 Z';
const ANAL = 'M 45 60 C 40 74, 26 86, 12 92 C 7 81, 9 63, 13 51 C 22 61, 34 62, 45 60 Z';
const CAUDAL = 'M 14 39 C 7 35, 2 40, 1 46 C 2 53, 7 58, 14 53 Z';
const PECTORAL = 'M 40 48 C 46 50, 47 58, 42 61 C 37 58, 36 51, 40 48 Z';

const OUTLINE = '#2a2118';
const FIN = '#f4d99a';
const FILAMENT = '#f7ecd2';
const WIDTH = 60;
const HEIGHT = 96;

export function Angelfish({ size = 72 }: { size?: number }) {
  const scale = size / WIDTH;
  const height = HEIGHT * scale;

  // Angelfish hold station on fluttering pectorals rather than driving with the tail.
  const pectoral = useOscillation(260);
  const threads = useOscillation(1600);
  const filaments = useOscillation(1400);
  const glide = useOscillation(2800);

  const pectoralRotation = pectoral.interpolate({
    inputRange: [0, 1],
    outputRange: ['-22deg', '14deg'],
  });
  const threadSway = threads.interpolate({ inputRange: [0, 1], outputRange: ['-7deg', '6deg'] });
  const filamentSway = filaments.interpolate({ inputRange: [0, 1], outputRange: ['-4deg', '4deg'] });
  const bob = glide.interpolate({ inputRange: [0, 1], outputRange: [-4, 4] });
  const tilt = glide.interpolate({ inputRange: [0, 1], outputRange: ['2deg', '-2deg'] });

  return (
    <Animated.View
      accessibilityLabel="Angelfish"
      style={[{ width: size, height }, { transform: [{ translateY: bob }, { rotate: tilt }] }]}
      pointerEvents="none"
    >
      {/* Fin-tip filaments, streaming back off the dorsal and anal tips. */}
      <Animated.View
        style={[
          styles.part,
          { transformOrigin: '23% 50%' },
          { transform: [{ rotate: filamentSway }] },
        ]}
      >
        <Svg width={size} height={height} viewBox="0 0 60 96">
          <Path d="M 12 3 C 7 9, 4 19, 4 30" stroke={FILAMENT} strokeWidth={1.5} fill="none" strokeLinecap="round" opacity={0.8} />
          <Path d="M 12 92 C 7 86, 4 76, 4 65" stroke={FILAMENT} strokeWidth={1.5} fill="none" strokeLinecap="round" opacity={0.8} />
        </Svg>
      </Animated.View>

      <View style={styles.part}>
        <Svg width={size} height={height} viewBox="0 0 60 96">
          <Defs>
            <LinearGradient id="angelfish-body" x1="0" y1="0" x2="0" y2="1">
              <Stop offset="0" stopColor="#fdf3d8" />
              <Stop offset="0.5" stopColor="#f4d99a" />
              <Stop offset="1" stopColor="#d8ad63" />
            </LinearGradient>
            <ClipPath id="angelfish-clip">
              <Path d={BODY} />
            </ClipPath>
          </Defs>

          <Path d={CAUDAL} fill={FIN} opacity={0.6} stroke={OUTLINE} strokeWidth={1.4} strokeLinejoin="round" />
          <Path d={DORSAL} fill={FIN} opacity={0.9} stroke={OUTLINE} strokeWidth={1.7} strokeLinejoin="round" />
          <Path d={ANAL} fill={FIN} opacity={0.9} stroke={OUTLINE} strokeWidth={1.7} strokeLinejoin="round" />
          {/* Fin rays fanning out from each base. */}
          <Path d="M 40 31 C 33 23, 24 14, 15 8 M 32 31 C 27 23, 21 16, 14 11 M 24 32 C 20 26, 16 21, 12 17" stroke={OUTLINE} strokeWidth={0.9} fill="none" opacity={0.3} />
          <Path d="M 40 60 C 33 69, 24 78, 15 86 M 32 60 C 27 69, 21 76, 14 82 M 24 60 C 20 67, 16 72, 12 77" stroke={OUTLINE} strokeWidth={0.9} fill="none" opacity={0.3} />

          <Path d={BODY} fill="url(#angelfish-body)" />
          {/* Vertical barring, one bar running through the eye. */}
          <G clipPath="url(#angelfish-clip)">
            <Path d="M 19 24 L 17 68" stroke={OUTLINE} strokeWidth={7} opacity={0.8} />
            <Path d="M 33 24 L 31 68" stroke={OUTLINE} strokeWidth={8} opacity={0.8} />
            <Path d="M 47 26 L 45 66" stroke={OUTLINE} strokeWidth={6} opacity={0.8} />
          </G>
          <Path d={BODY} fill="none" stroke={OUTLINE} strokeWidth={1.9} strokeLinejoin="round" />

          <Ellipse cx={46} cy={41} rx={3.6} ry={3.8} fill="#fdf6ec" stroke={OUTLINE} strokeWidth={1.3} />
          <Ellipse cx={47} cy={41} rx={1.8} ry={2} fill={OUTLINE} />
        </Svg>
      </View>

      <Animated.View
        style={[
          styles.part,
          { transformOrigin: '67% 51%' },
          { transform: [{ rotate: pectoralRotation }] },
        ]}
      >
        <Svg width={size} height={height} viewBox="0 0 60 96">
          <Path d={PECTORAL} fill="#fdf3d8" opacity={0.7} stroke={OUTLINE} strokeWidth={1.3} strokeLinejoin="round" />
        </Svg>
      </Animated.View>

      {/* The trailing pelvic threads — the most recognisable thing about an angelfish. */}
      <Animated.View
        style={[styles.part, { transformOrigin: '63% 67%' }, { transform: [{ rotate: threadSway }] }]}
      >
        <Svg width={size} height={height} viewBox="0 0 60 96">
          <Path d="M 38 63 C 37 74, 33 84, 27 93" stroke={FILAMENT} strokeWidth={2} fill="none" strokeLinecap="round" />
          <Path d="M 35 64 C 34 74, 31 83, 25 91" stroke={FILAMENT} strokeWidth={1.5} fill="none" strokeLinecap="round" opacity={0.75} />
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
