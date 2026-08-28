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

const AnimatedPath = Animated.createAnimatedComponent(Path);

const BODY =
  'M 3 16 C 6 9, 14 5, 24 5 C 34 5, 42 9, 45 16 C 42 23, 34 27, 24 27 C 14 27, 6 23, 3 16 Z';
// Forked caudal fin — the notch is what separates a tetra silhouette from a guppy fan.
const TAIL = 'M 17 16 L 2 3 L 7 16 L 2 29 Z';
const NEON_STRIPE = 'M 9 14 C 18 12, 30 12, 42 14';
const RED_STRIPE = 'M 20 20 C 28 21, 36 21, 43 19';

// Painterly / soft-gradient palette: airbrushed volume + glow, no outlines.
const SILVER_LIGHT = '#eefaff';
const SILVER = '#a8cfe3';
const SILVER_DEEP = '#3d6a85';
const BELLY_SHADE = '#25465e';
const NEON = '#3ff0ff';
const NEON_CORE = '#eaffff';
const RED = '#ff3b52';
const SHEEN = '#e6f8ff';
const RIM = '#d3f4ff';
const GLOW = '#59e6ff';

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
          <Defs>
            <LinearGradient id="tetra-tail-fill" x1="1" y1="0.5" x2="0" y2="0.5">
              <Stop offset="0" stopColor={SILVER} stopOpacity={0.9} />
              {/* Tail edge dissolves like an airbrush stroke rather than ending hard. */}
              <Stop offset="1" stopColor={SILVER_DEEP} stopOpacity={0.3} />
            </LinearGradient>
            <RadialGradient id="tetra-tail-glow" cx="80%" cy="50%" r="90%">
              <Stop offset="0" stopColor={GLOW} stopOpacity={0.35} />
              <Stop offset="1" stopColor={GLOW} stopOpacity={0} />
            </RadialGradient>
          </Defs>
          <Path d={TAIL} fill="url(#tetra-tail-glow)" transform="translate(9.5 16) scale(1.25) translate(-9.5 -16)" />
          <Path d={TAIL} fill="url(#tetra-tail-fill)" />
          {/* Soft fin-ray sheen, feathered by opacity. */}
          <Path d="M 15 14 C 11 11, 7 8, 4 5" stroke={SHEEN} strokeWidth={1.8} fill="none" opacity={0.3} strokeLinecap="round" />
          <Path d="M 15 18 C 11 21, 7 24, 4 27" stroke={SHEEN} strokeWidth={1.8} fill="none" opacity={0.3} strokeLinecap="round" />
        </Svg>
      </Animated.View>

      <View style={styles.body} pointerEvents="none">
        <Svg width={size * (48 / 60)} height={height} viewBox="0 0 48 32">
          <Defs>
            <ClipPath id="tetra-body-clip">
              <Path d={BODY} />
            </ClipPath>
            {/* Light source upper-left: bright core rolling into deep shadow. */}
            <RadialGradient id="tetra-body-fill" cx="36%" cy="26%" r="85%">
              <Stop offset="0" stopColor={SILVER_LIGHT} />
              <Stop offset="0.5" stopColor={SILVER} />
              <Stop offset="1" stopColor={SILVER_DEEP} />
            </RadialGradient>
            {/* Counter-shading: belly falls into shadow so the form reads round. */}
            <LinearGradient id="tetra-belly" x1="0" y1="0" x2="0" y2="1">
              <Stop offset="0.55" stopColor={BELLY_SHADE} stopOpacity={0} />
              <Stop offset="1" stopColor={BELLY_SHADE} stopOpacity={0.45} />
            </LinearGradient>
            <RadialGradient id="tetra-sheen" cx="38%" cy="24%" r="45%">
              <Stop offset="0" stopColor={SHEEN} stopOpacity={0.8} />
              <Stop offset="1" stopColor={SHEEN} stopOpacity={0} />
            </RadialGradient>
            <RadialGradient id="tetra-halo" cx="50%" cy="50%" r="50%">
              <Stop offset="0.55" stopColor={GLOW} stopOpacity={0.3} />
              <Stop offset="0.8" stopColor={GLOW} stopOpacity={0.12} />
              <Stop offset="1" stopColor={GLOW} stopOpacity={0} />
            </RadialGradient>
            <RadialGradient id="tetra-fin-fill" cx="50%" cy="100%" r="100%">
              <Stop offset="0" stopColor={SILVER} stopOpacity={0.85} />
              <Stop offset="1" stopColor={SILVER_DEEP} stopOpacity={0.4} />
            </RadialGradient>
          </Defs>

          {/* Layered halo glow: concentric silhouettes scaled about the body centre. */}
          <Path d={BODY} fill="url(#tetra-halo)" transform="translate(24 16) scale(1.22) translate(-24 -16)" />
          <Path d={BODY} fill={GLOW} opacity={0.12} transform="translate(24 16) scale(1.1) translate(-24 -16)" />

          {/* Fins sit behind the translucent body. */}
          <Path d="M 18 8 C 23 2, 29 3, 31 8 Z" fill="url(#tetra-fin-fill)" opacity={0.85} />
          <Path d="M 20 25 C 23 31, 29 31, 31 24 Z" fill="url(#tetra-fin-fill)" opacity={0.85} transform="translate(25.5 27.5) scale(1 -1) translate(-25.5 -27.5)" />

          <Path d={BODY} fill="url(#tetra-body-fill)" />
          <G clipPath="url(#tetra-body-clip)">
            <Path d={BODY} fill="url(#tetra-belly)" />

            {/* Electric stripe: a wide faint halo, mid glow, then a bright pulsing core —
                stacked strokes fake a gaussian bloom without filters. */}
            <AnimatedPath d={NEON_STRIPE} stroke={NEON} strokeWidth={11} strokeLinecap="round" fill="none" opacity={glow} />
            <AnimatedPath d={NEON_STRIPE} stroke={NEON} strokeWidth={6.5} strokeLinecap="round" fill="none" opacity={glow} />
            <AnimatedPath d={NEON_STRIPE} stroke={NEON} strokeWidth={3.2} strokeLinecap="round" fill="none" opacity={core} />
            <AnimatedPath d={NEON_STRIPE} stroke={NEON_CORE} strokeWidth={1.2} strokeLinecap="round" fill="none" opacity={core} />

            {/* Red rear stripe as a feathered glowing band. */}
            <Path d={RED_STRIPE} stroke={RED} strokeWidth={8} strokeLinecap="round" fill="none" opacity={0.18} />
            <Path d={RED_STRIPE} stroke={RED} strokeWidth={5} strokeLinecap="round" fill="none" opacity={0.4} />
            <Path d={RED_STRIPE} stroke={RED} strokeWidth={2.6} strokeLinecap="round" fill="none" opacity={0.95} />
            <Path d={RED_STRIPE} stroke="#ff97a3" strokeWidth={1} strokeLinecap="round" fill="none" opacity={0.7} />

            {/* Sheen over the upper flank, then a rim light on the lit edge. */}
            <Path d={BODY} fill="url(#tetra-sheen)" />
            <Path
              d="M 5 12 C 8 8, 15 5.5, 24 5.5"
              stroke={RIM}
              strokeWidth={1.8}
              fill="none"
              opacity={0.55}
              strokeLinecap="round"
            />
          </G>

          {/* Eye with a soft socket glow instead of a hard ring. */}
          <Ellipse cx={38} cy={12} rx={4.2} ry={4.4} fill={SHEEN} opacity={0.35} />
          <Ellipse cx={38} cy={12} rx={3} ry={3.2} fill="#fdf6ec" opacity={0.95} />
          <Ellipse cx={39} cy={12} rx={1.5} ry={1.7} fill="#0d1b2a" />
          <Ellipse cx={38.4} cy={11.4} rx={0.6} ry={0.7} fill="#fff" opacity={0.9} />
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
