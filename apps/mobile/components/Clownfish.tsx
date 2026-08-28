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

const BODY = 'M 6 20 C 6 9, 22 4, 34 6 C 47 8, 55 14, 57 20 C 55 26, 47 32, 34 34 C 22 36, 6 31, 6 20 Z';
const TAIL = 'M 20 20 L 2 5 C 8 20, 8 20, 2 35 Z';

// Painterly / soft-gradient palette: all volume comes from airbrushed radial
// gradients, counter-shading, and a layered halo glow — no hard outlines.
const ORANGE_LIGHT = '#ffc285';
const ORANGE = '#f4712c';
const ORANGE_DEEP = '#a53a0c';
const BELLY_SHADE = '#7c2c08';
const BAND = '#fff6ea';
const SHEEN = '#ffe3c2';
const RIM = '#ffd9a8';
const GLOW = '#ff9142';

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
          <Defs>
            <LinearGradient id="clownfish-tail-fill" x1="1" y1="0.5" x2="0" y2="0.5">
              <Stop offset="0" stopColor={ORANGE} />
              <Stop offset="0.6" stopColor={ORANGE_DEEP} />
              {/* Tail edge dissolves like an airbrush stroke rather than ending hard. */}
              <Stop offset="1" stopColor={ORANGE_DEEP} stopOpacity={0.35} />
            </LinearGradient>
            <RadialGradient id="clownfish-tail-glow" cx="80%" cy="50%" r="90%">
              <Stop offset="0" stopColor={GLOW} stopOpacity={0.45} />
              <Stop offset="1" stopColor={GLOW} stopOpacity={0} />
            </RadialGradient>
          </Defs>
          <Path d={TAIL} fill="url(#clownfish-tail-glow)" transform="translate(10 20) scale(1.25) translate(-10 -20)" />
          <Path d={TAIL} fill="url(#clownfish-tail-fill)" />
          {/* Soft fin-ray sheen, feathered by opacity instead of drawn lines. */}
          <Path d="M 18 18 C 12 14, 7 10, 4 7" stroke={SHEEN} strokeWidth={2.4} fill="none" opacity={0.25} strokeLinecap="round" />
          <Path d="M 18 22 C 12 26, 7 30, 4 33" stroke={SHEEN} strokeWidth={2.4} fill="none" opacity={0.25} strokeLinecap="round" />
        </Svg>
      </Animated.View>

      <View style={styles.body} pointerEvents="none">
        <Svg width={size * (60 / 72)} height={height} viewBox="0 0 60 40">
          <Defs>
            <ClipPath id="clownfish-body">
              <Path d={BODY} />
            </ClipPath>
            {/* Light source upper-left: bright core rolling into deep shadow — the airbrushed volume. */}
            <RadialGradient id="clownfish-body-fill" cx="36%" cy="26%" r="85%">
              <Stop offset="0" stopColor={ORANGE_LIGHT} />
              <Stop offset="0.5" stopColor={ORANGE} />
              <Stop offset="1" stopColor={ORANGE_DEEP} />
            </RadialGradient>
            {/* Counter-shading: belly falls into shadow so the form reads round. */}
            <LinearGradient id="clownfish-belly" x1="0" y1="0" x2="0" y2="1">
              <Stop offset="0.55" stopColor={BELLY_SHADE} stopOpacity={0} />
              <Stop offset="1" stopColor={BELLY_SHADE} stopOpacity={0.45} />
            </LinearGradient>
            <RadialGradient id="clownfish-sheen" cx="38%" cy="24%" r="45%">
              <Stop offset="0" stopColor={SHEEN} stopOpacity={0.8} />
              <Stop offset="1" stopColor={SHEEN} stopOpacity={0} />
            </RadialGradient>
            {/* Ambient halo so the fish appears lit from within against dark water. */}
            <RadialGradient id="clownfish-halo" cx="50%" cy="50%" r="50%">
              <Stop offset="0.55" stopColor={GLOW} stopOpacity={0.3} />
              <Stop offset="0.8" stopColor={GLOW} stopOpacity={0.12} />
              <Stop offset="1" stopColor={GLOW} stopOpacity={0} />
            </RadialGradient>
            <RadialGradient id="clownfish-fin-fill" cx="50%" cy="100%" r="100%">
              <Stop offset="0" stopColor={ORANGE} />
              <Stop offset="1" stopColor={ORANGE_DEEP} stopOpacity={0.5} />
            </RadialGradient>
          </Defs>

          {/* Layered halo glow: concentric soft silhouettes, scaled about the body centre. */}
          <Path d={BODY} fill="url(#clownfish-halo)" transform="translate(31.5 20) scale(1.22) translate(-31.5 -20)" />
          <Path d={BODY} fill={GLOW} opacity={0.14} transform="translate(31.5 20) scale(1.1) translate(-31.5 -20)" />

          {/* Fins share the body gradient family so they read as one soft form. */}
          <Path d="M 16 10 C 24 -1, 38 1, 45 9 Z" fill="url(#clownfish-fin-fill)" opacity={0.85} />
          <Path d="M 20 30 C 24 39, 32 39, 36 31 Z" fill="url(#clownfish-fin-fill)" opacity={0.85} transform="translate(28 34.5) scale(1 -1) translate(-28 -34.5)" />

          <Path d={BODY} fill="url(#clownfish-body-fill)" />
          <G clipPath="url(#clownfish-body)">
            {/* Belly shadow beneath everything else painted on the body. */}
            <Path d={BODY} fill="url(#clownfish-belly)" />
            {/* Feathered light bands: three stacked strokes, wide-and-faint to narrow-and-bright,
                fake a gaussian edge without filters. */}
            <Path d="M 17 0 L 12 40" stroke={BAND} strokeWidth={9} opacity={0.18} />
            <Path d="M 34 0 L 29 40" stroke={BAND} strokeWidth={9} opacity={0.18} />
            <Path d="M 52 0 L 49 40" stroke={BAND} strokeWidth={8} opacity={0.18} />
            <Path d="M 17 0 L 12 40" stroke={BAND} strokeWidth={6.5} opacity={0.4} />
            <Path d="M 34 0 L 29 40" stroke={BAND} strokeWidth={6.5} opacity={0.4} />
            <Path d="M 52 0 L 49 40" stroke={BAND} strokeWidth={5.5} opacity={0.4} />
            <Path d="M 17 0 L 12 40" stroke={BAND} strokeWidth={4} opacity={0.9} />
            <Path d="M 34 0 L 29 40" stroke={BAND} strokeWidth={4} opacity={0.9} />
            <Path d="M 52 0 L 49 40" stroke={BAND} strokeWidth={3} opacity={0.9} />
            {/* Sheen highlight over the upper flank, then a rim light tracing the lit edge. */}
            <Path d={BODY} fill="url(#clownfish-sheen)" />
            <Path
              d="M 8 16 C 10 9, 22 5, 34 6.5"
              stroke={RIM}
              strokeWidth={2.2}
              fill="none"
              opacity={0.55}
              strokeLinecap="round"
            />
          </G>

          {/* Pectoral fin as a soft translucent form. */}
          <Path d="M 26 21 C 32 20, 36 24, 34 29 C 29 29, 26 26, 26 21 Z" fill={ORANGE_DEEP} opacity={0.4} />

          {/* Eye with a soft socket glow instead of a hard ring. */}
          <Ellipse cx={46} cy={17} rx={5.2} ry={5.6} fill={SHEEN} opacity={0.35} />
          <Ellipse cx={46} cy={17} rx={4} ry={4.4} fill={BAND} opacity={0.95} />
          <Ellipse cx={47} cy={17} rx={2} ry={2.4} fill="#3a1c0c" />
          <Ellipse cx={46.2} cy={16.2} rx={0.8} ry={0.9} fill="#fff" opacity={0.9} />
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
