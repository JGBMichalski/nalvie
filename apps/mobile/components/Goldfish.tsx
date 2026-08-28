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

const BODY =
  'M 4 22 C 4 12, 14 6, 26 6 C 40 6, 49 13, 50 22 C 49 31, 40 38, 26 38 C 14 38, 4 32, 4 22 Z';
const DORSAL = 'M 14 9 C 22 -2, 34 0, 40 10 Z';
// A fancy goldfish's veil tail hangs in two lobes rather than one blade.
const TAIL_UPPER = 'M 27 22 C 19 11, 9 2, 2 5 C 7 13, 10 18, 26 23 Z';
const TAIL_LOWER = 'M 27 22 C 19 33, 9 42, 2 39 C 7 31, 10 26, 26 21 Z';

// Painterly / soft-gradient palette: airbrushed radial volume, counter-shading
// and a layered halo glow — no hard outlines.
const GOLD_LIGHT = '#ffe8a8';
const GOLD = '#ffa32e';
const GOLD_DEEP = '#c04a12';
const BELLY_SHADE = '#8a2f08';
const SHEEN = '#fff1cf';
const RIM = '#ffe2a3';
const GLOW = '#ffb347';

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
        <LinearGradient id={gradientId} x1="1" y1="0.5" x2="0" y2="0.5">
          <Stop offset="0" stopColor={GOLD} stopOpacity={0.95} />
          <Stop offset="0.55" stopColor={GOLD_LIGHT} stopOpacity={0.7} />
          {/* Veil tips dissolve like an airbrush stroke rather than ending hard. */}
          <Stop offset="1" stopColor={GOLD_LIGHT} stopOpacity={0.22} />
        </LinearGradient>
        <RadialGradient id={`${gradientId}-glow`} cx="80%" cy="50%" r="90%">
          <Stop offset="0" stopColor={GLOW} stopOpacity={0.4} />
          <Stop offset="1" stopColor={GLOW} stopOpacity={0} />
        </RadialGradient>
      </Defs>
      <Path
        d={d}
        fill={`url(#${gradientId}-glow)`}
        transform="translate(15 22) scale(1.22) translate(-15 -22)"
      />
      <Path d={d} fill={`url(#${gradientId})`} />
      {/* Soft fin-ray sheen, feathered by opacity instead of drawn lines. */}
      <Path d="M 24 21 C 17 16, 11 11, 6 7" stroke={SHEEN} strokeWidth={2} fill="none" opacity={0.25} strokeLinecap="round" />
      <Path d="M 24 23 C 17 28, 11 33, 6 37" stroke={SHEEN} strokeWidth={2} fill="none" opacity={0.25} strokeLinecap="round" />
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
            <ClipPath id="goldfish-clip">
              <Path d={BODY} />
            </ClipPath>
            {/* Light source upper-left: bright core rolling into deep shadow. */}
            <RadialGradient id="goldfish-body" cx="36%" cy="26%" r="85%">
              <Stop offset="0" stopColor={GOLD_LIGHT} />
              <Stop offset="0.5" stopColor={GOLD} />
              <Stop offset="1" stopColor={GOLD_DEEP} />
            </RadialGradient>
            {/* Counter-shading: belly falls into shadow so the form reads round. */}
            <LinearGradient id="goldfish-belly" x1="0" y1="0" x2="0" y2="1">
              <Stop offset="0.55" stopColor={BELLY_SHADE} stopOpacity={0} />
              <Stop offset="1" stopColor={BELLY_SHADE} stopOpacity={0.45} />
            </LinearGradient>
            <RadialGradient id="goldfish-sheen" cx="38%" cy="24%" r="45%">
              <Stop offset="0" stopColor={SHEEN} stopOpacity={0.8} />
              <Stop offset="1" stopColor={SHEEN} stopOpacity={0} />
            </RadialGradient>
            {/* Ambient halo so the fish appears lit from within against dark water. */}
            <RadialGradient id="goldfish-halo" cx="50%" cy="50%" r="50%">
              <Stop offset="0.55" stopColor={GLOW} stopOpacity={0.3} />
              <Stop offset="0.8" stopColor={GLOW} stopOpacity={0.12} />
              <Stop offset="1" stopColor={GLOW} stopOpacity={0} />
            </RadialGradient>
            <RadialGradient id="goldfish-fin-fill" cx="50%" cy="100%" r="100%">
              <Stop offset="0" stopColor={GOLD} />
              <Stop offset="1" stopColor={GOLD_DEEP} stopOpacity={0.5} />
            </RadialGradient>
          </Defs>

          {/* Layered halo glow: concentric soft silhouettes scaled about the body centre. */}
          <Path d={BODY} fill="url(#goldfish-halo)" transform="translate(27 22) scale(1.22) translate(-27 -22)" />
          <Path d={BODY} fill={GLOW} opacity={0.14} transform="translate(27 22) scale(1.1) translate(-27 -22)" />

          {/* Fins share the body gradient family so they read as one soft form. */}
          <Path d={DORSAL} fill="url(#goldfish-fin-fill)" opacity={0.85} />
          <Path
            d="M 18 35 C 21 43, 29 43, 32 34 Z"
            fill="url(#goldfish-fin-fill)"
            opacity={0.85}
            transform="translate(25 38.5) scale(1 -1) translate(-25 -38.5)"
          />

          <Path d={BODY} fill="url(#goldfish-body)" />
          <G clipPath="url(#goldfish-clip)">
            <Path d={BODY} fill="url(#goldfish-belly)" />
            {/* Feathered scale arcs: stacked wide-and-faint to narrow-and-bright strokes
                fake a gaussian edge without filters. */}
            <Path d="M 16 14 C 20 18, 20 26, 16 30" stroke={SHEEN} strokeWidth={3.2} fill="none" opacity={0.14} />
            <Path d="M 25 12 C 30 17, 30 27, 25 32" stroke={SHEEN} strokeWidth={3.2} fill="none" opacity={0.12} />
            <Path d="M 34 12 C 39 17, 39 27, 34 32" stroke={SHEEN} strokeWidth={3} fill="none" opacity={0.1} />
            <Path d="M 16 14 C 20 18, 20 26, 16 30" stroke={SHEEN} strokeWidth={1.3} fill="none" opacity={0.5} />
            <Path d="M 25 12 C 30 17, 30 27, 25 32" stroke={SHEEN} strokeWidth={1.3} fill="none" opacity={0.45} />
            <Path d="M 34 12 C 39 17, 39 27, 34 32" stroke={SHEEN} strokeWidth={1.3} fill="none" opacity={0.35} />
            {/* Sheen highlight over the upper flank, then a rim light tracing the lit edge. */}
            <Path d={BODY} fill="url(#goldfish-sheen)" />
            <Path
              d="M 7 15 C 10 9, 18 6, 28 6.5"
              stroke={RIM}
              strokeWidth={2.2}
              fill="none"
              opacity={0.55}
              strokeLinecap="round"
            />
          </G>

          {/* Pectoral fin as a soft translucent form. */}
          <Path d="M 24 25 C 31 25, 35 29, 32 33 C 27 33, 24 29, 24 25 Z" fill={GOLD_DEEP} opacity={0.4} />

          {/* Fancy goldfish have a pronounced, slightly protruding eye — soft socket glow, no ring. */}
          <Ellipse cx={42} cy={18} rx={5.8} ry={6} fill={SHEEN} opacity={0.35} />
          <Ellipse cx={42} cy={18} rx={4.4} ry={4.6} fill="#fdf6ec" opacity={0.95} />
          <Ellipse cx={43} cy={18} rx={2.4} ry={2.6} fill="#2b1206" />
          <Ellipse cx={41.6} cy={16.6} rx={1} ry={1.1} fill="#ffffff" opacity={0.9} />
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
