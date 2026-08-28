import { Animated, StyleSheet, View } from 'react-native';
import Svg, {
  ClipPath,
  Defs,
  Ellipse,
  G,
  LinearGradient,
  Path,
  RadialGradient,
  Stop,
} from 'react-native-svg';

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

// Painterly / soft-gradient palette: silvery airbrushed volume, feathered dark
// bands, layered halo glow — no hard outlines.
const SILVER_LIGHT = '#fdf6df';
const SILVER = '#efd8a4';
const SILVER_DEEP = '#a3814c';
const BELLY_SHADE = '#6e5330';
const BAND = '#3a2d1c';
const SHEEN = '#fffaf0';
const RIM = '#fff3d4';
const GLOW = '#f2dfae';
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
            {/* Light source upper-left: bright core rolling into deep shadow. */}
            <RadialGradient id="angelfish-body" cx="36%" cy="26%" r="85%">
              <Stop offset="0" stopColor={SILVER_LIGHT} />
              <Stop offset="0.5" stopColor={SILVER} />
              <Stop offset="1" stopColor={SILVER_DEEP} />
            </RadialGradient>
            {/* Counter-shading: belly falls into shadow so the disc reads round. */}
            <LinearGradient id="angelfish-belly" x1="0" y1="0" x2="0" y2="1">
              <Stop offset="0.55" stopColor={BELLY_SHADE} stopOpacity={0} />
              <Stop offset="1" stopColor={BELLY_SHADE} stopOpacity={0.45} />
            </LinearGradient>
            <RadialGradient id="angelfish-sheen" cx="38%" cy="24%" r="45%">
              <Stop offset="0" stopColor={SHEEN} stopOpacity={0.8} />
              <Stop offset="1" stopColor={SHEEN} stopOpacity={0} />
            </RadialGradient>
            {/* Ambient halo so the fish appears lit from within against dark water. */}
            <RadialGradient id="angelfish-halo" cx="50%" cy="50%" r="50%">
              <Stop offset="0.55" stopColor={GLOW} stopOpacity={0.3} />
              <Stop offset="0.8" stopColor={GLOW} stopOpacity={0.12} />
              <Stop offset="1" stopColor={GLOW} stopOpacity={0} />
            </RadialGradient>
            {/* Tall fins dissolve toward their raked-back tips. */}
            <LinearGradient id="angelfish-dorsal-fill" x1="0.7" y1="1" x2="0.1" y2="0">
              <Stop offset="0" stopColor={SILVER} />
              <Stop offset="0.6" stopColor={SILVER_DEEP} stopOpacity={0.75} />
              <Stop offset="1" stopColor={SILVER_DEEP} stopOpacity={0.3} />
            </LinearGradient>
            <LinearGradient id="angelfish-anal-fill" x1="0.7" y1="0" x2="0.1" y2="1">
              <Stop offset="0" stopColor={SILVER} />
              <Stop offset="0.6" stopColor={SILVER_DEEP} stopOpacity={0.75} />
              <Stop offset="1" stopColor={SILVER_DEEP} stopOpacity={0.3} />
            </LinearGradient>
            <LinearGradient id="angelfish-caudal-fill" x1="1" y1="0.5" x2="0" y2="0.5">
              <Stop offset="0" stopColor={SILVER} stopOpacity={0.8} />
              <Stop offset="1" stopColor={SILVER_DEEP} stopOpacity={0.25} />
            </LinearGradient>
            <RadialGradient id="angelfish-tail-glow" cx="80%" cy="50%" r="90%">
              <Stop offset="0" stopColor={GLOW} stopOpacity={0.4} />
              <Stop offset="1" stopColor={GLOW} stopOpacity={0} />
            </RadialGradient>
            <ClipPath id="angelfish-clip">
              <Path d={BODY} />
            </ClipPath>
          </Defs>

          {/* Layered halo glow: concentric soft silhouettes scaled about the body centre. */}
          <Path d={BODY} fill="url(#angelfish-halo)" transform="translate(33.5 46) scale(1.22) translate(-33.5 -46)" />
          <Path d={BODY} fill={GLOW} opacity={0.14} transform="translate(33.5 46) scale(1.1) translate(-33.5 -46)" />

          {/* Soft glow behind the tail, then the translucent caudal fin. */}
          <Path d={CAUDAL} fill="url(#angelfish-tail-glow)" transform="translate(7.5 46) scale(1.25) translate(-7.5 -46)" />
          <Path d={CAUDAL} fill="url(#angelfish-caudal-fill)" />
          <Path d={DORSAL} fill="url(#angelfish-dorsal-fill)" />
          <Path d={ANAL} fill="url(#angelfish-anal-fill)" />
          {/* Fin-ray sheen, feathered by opacity instead of drawn lines. */}
          <Path d="M 40 31 C 33 23, 24 14, 15 8 M 32 31 C 27 23, 21 16, 14 11 M 24 32 C 20 26, 16 21, 12 17" stroke={SHEEN} strokeWidth={1.6} fill="none" opacity={0.22} strokeLinecap="round" />
          <Path d="M 40 60 C 33 69, 24 78, 15 86 M 32 60 C 27 69, 21 76, 14 82 M 24 60 C 20 67, 16 72, 12 77" stroke={SHEEN} strokeWidth={1.6} fill="none" opacity={0.22} strokeLinecap="round" />

          <Path d={BODY} fill="url(#angelfish-body)" />
          <G clipPath="url(#angelfish-clip)">
            {/* Belly shadow beneath everything else painted on the body. */}
            <Path d={BODY} fill="url(#angelfish-belly)" />
            {/* Feathered dark bars: stacked strokes, wide-and-faint to narrow-and-strong,
                fake a gaussian edge without filters. One bar runs through the eye. */}
            <Path d="M 19 24 L 17 68" stroke={BAND} strokeWidth={11} opacity={0.16} />
            <Path d="M 33 24 L 31 68" stroke={BAND} strokeWidth={12} opacity={0.16} />
            <Path d="M 47 26 L 45 66" stroke={BAND} strokeWidth={10} opacity={0.16} />
            <Path d="M 19 24 L 17 68" stroke={BAND} strokeWidth={8} opacity={0.35} />
            <Path d="M 33 24 L 31 68" stroke={BAND} strokeWidth={9} opacity={0.35} />
            <Path d="M 47 26 L 45 66" stroke={BAND} strokeWidth={7} opacity={0.35} />
            <Path d="M 19 24 L 17 68" stroke={BAND} strokeWidth={5} opacity={0.75} />
            <Path d="M 33 24 L 31 68" stroke={BAND} strokeWidth={6} opacity={0.75} />
            <Path d="M 47 26 L 45 66" stroke={BAND} strokeWidth={4} opacity={0.75} />
            {/* Sheen highlight over the upper flank, then a rim light tracing the lit edge. */}
            <Path d={BODY} fill="url(#angelfish-sheen)" />
            <Path
              d="M 15 37 C 19 30, 26 26.5, 34 27"
              stroke={RIM}
              strokeWidth={2}
              fill="none"
              opacity={0.55}
              strokeLinecap="round"
            />
          </G>

          {/* Eye with a soft socket glow instead of a hard ring. */}
          <Ellipse cx={46} cy={41} rx={4.8} ry={5} fill={SHEEN} opacity={0.35} />
          <Ellipse cx={46} cy={41} rx={3.6} ry={3.8} fill="#fdf6ec" opacity={0.95} />
          <Ellipse cx={47} cy={41} rx={1.8} ry={2} fill="#241a0e" />
          <Ellipse cx={46.3} cy={40.3} rx={0.7} ry={0.8} fill="#fff" opacity={0.9} />
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
          <Path d={PECTORAL} fill={SILVER_LIGHT} opacity={0.55} />
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
