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

const CARAPACE =
  'M 40 14 C 43 20, 40 26, 34 29 C 26 32, 15 31, 7 27 C 12 25, 14 22, 14 19 C 16 13, 22 9, 30 9 C 36 9, 39 11, 40 14 Z';
const TAIL_FAN = 'M 22 24 C 16 17, 8 15, 2 19 C 6 24, 6 28, 2 33 C 9 35, 16 30, 22 26 Z';

// Painterly / soft-gradient palette: airbrushed volume + halo glow, no outlines.
const CORAL_LIGHT = '#ffd0b8';
const CORAL = '#ff8a6b';
const CORAL_DEEP = '#b13c24';
const BELLY_SHADE = '#7e2413';
const BAND = '#fff0e6';
const SHEEN = '#ffe0cc';
const RIM = '#ffd3ba';
const GLOW = '#ff9d7a';

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
          <Defs>
            {/* Tail fan dissolves toward its tips like an airbrush stroke. */}
            <LinearGradient id="shrimp-tail-fill" x1="1" y1="0.5" x2="0" y2="0.5">
              <Stop offset="0" stopColor={CORAL} />
              <Stop offset="0.6" stopColor={CORAL_DEEP} stopOpacity={0.85} />
              <Stop offset="1" stopColor={CORAL_DEEP} stopOpacity={0.3} />
            </LinearGradient>
            <RadialGradient id="shrimp-tail-glow" cx="80%" cy="50%" r="90%">
              <Stop offset="0" stopColor={GLOW} stopOpacity={0.4} />
              <Stop offset="1" stopColor={GLOW} stopOpacity={0} />
            </RadialGradient>
          </Defs>
          <Path d={TAIL_FAN} fill="url(#shrimp-tail-glow)" transform="translate(12 26) scale(1.25) translate(-12 -26)" />
          <Path d={TAIL_FAN} fill="url(#shrimp-tail-fill)" />
          {/* Soft fan-ray sheens instead of drawn lines. */}
          <Path d="M 20 24 C 14 21, 9 20, 4 20" stroke={SHEEN} strokeWidth={2} fill="none" opacity={0.25} strokeLinecap="round" />
          <Path d="M 20 26 C 14 29, 9 31, 4 32" stroke={SHEEN} strokeWidth={2} fill="none" opacity={0.25} strokeLinecap="round" />
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
          {/* Swimmerets as delicate translucent strokes, feathered wide-then-narrow. */}
          <Path d="M 14 27 L 12 34 M 19 29 L 18 36 M 24 30 L 24 37 M 29 30 L 30 36" stroke={GLOW} strokeWidth={2.6} strokeLinecap="round" opacity={0.2} />
          <Path d="M 14 27 L 12 34 M 19 29 L 18 36 M 24 30 L 24 37 M 29 30 L 30 36" stroke={CORAL} strokeWidth={1.3} strokeLinecap="round" opacity={0.55} />
        </Svg>
      </Animated.View>

      <View style={[styles.part, { left: 18 * scale, width: 44 * scale }]}>
        <Svg width={44 * scale} height={height} viewBox="0 0 44 40">
          <Defs>
            <ClipPath id="shrimp-carapace">
              <Path d={CARAPACE} />
            </ClipPath>
            {/* Light source upper-left: bright core rolling into deep shadow. */}
            <RadialGradient id="shrimp-body-fill" cx="55%" cy="28%" r="85%">
              <Stop offset="0" stopColor={CORAL_LIGHT} />
              <Stop offset="0.5" stopColor={CORAL} />
              <Stop offset="1" stopColor={CORAL_DEEP} />
            </RadialGradient>
            {/* Counter-shading: underside falls into shadow so the coil reads round. */}
            <LinearGradient id="shrimp-belly" x1="0" y1="0" x2="0" y2="1">
              <Stop offset="0.55" stopColor={BELLY_SHADE} stopOpacity={0} />
              <Stop offset="1" stopColor={BELLY_SHADE} stopOpacity={0.45} />
            </LinearGradient>
            <RadialGradient id="shrimp-sheen" cx="58%" cy="26%" r="45%">
              <Stop offset="0" stopColor={SHEEN} stopOpacity={0.8} />
              <Stop offset="1" stopColor={SHEEN} stopOpacity={0} />
            </RadialGradient>
            {/* Ambient halo so the shrimp glows against dark water. */}
            <RadialGradient id="shrimp-halo" cx="50%" cy="50%" r="50%">
              <Stop offset="0.55" stopColor={GLOW} stopOpacity={0.3} />
              <Stop offset="0.8" stopColor={GLOW} stopOpacity={0.12} />
              <Stop offset="1" stopColor={GLOW} stopOpacity={0} />
            </RadialGradient>
          </Defs>

          {/* Layered halo glow: concentric silhouettes scaled about the body centre. */}
          <Path d={CARAPACE} fill="url(#shrimp-halo)" transform="translate(23.5 20) scale(1.22) translate(-23.5 -20)" />
          <Path d={CARAPACE} fill={GLOW} opacity={0.14} transform="translate(23.5 20) scale(1.1) translate(-23.5 -20)" />

          <Path d={CARAPACE} fill="url(#shrimp-body-fill)" />
          <G clipPath="url(#shrimp-carapace)">
            <Path d={CARAPACE} fill="url(#shrimp-belly)" />
            {/* Feathered segment bands: stacked strokes fake a gaussian edge without filters. */}
            <Path d="M 30 8 C 28 16, 27 24, 28 32" stroke={BAND} strokeWidth={5.5} fill="none" opacity={0.15} />
            <Path d="M 23 8 C 21 16, 20 25, 21 33" stroke={BAND} strokeWidth={5.5} fill="none" opacity={0.15} />
            <Path d="M 16 10 C 14 18, 14 25, 15 32" stroke={BAND} strokeWidth={5} fill="none" opacity={0.15} />
            <Path d="M 30 8 C 28 16, 27 24, 28 32" stroke={BAND} strokeWidth={3.4} fill="none" opacity={0.3} />
            <Path d="M 23 8 C 21 16, 20 25, 21 33" stroke={BAND} strokeWidth={3.4} fill="none" opacity={0.3} />
            <Path d="M 16 10 C 14 18, 14 25, 15 32" stroke={BAND} strokeWidth={3} fill="none" opacity={0.3} />
            <Path d="M 30 8 C 28 16, 27 24, 28 32" stroke={BAND} strokeWidth={1.6} fill="none" opacity={0.7} />
            <Path d="M 23 8 C 21 16, 20 25, 21 33" stroke={BAND} strokeWidth={1.6} fill="none" opacity={0.7} />
            <Path d="M 16 10 C 14 18, 14 25, 15 32" stroke={BAND} strokeWidth={1.4} fill="none" opacity={0.7} />
            {/* Sheen over the upper flank, then a rim light tracing the lit edge. */}
            <Path d={CARAPACE} fill="url(#shrimp-sheen)" />
            <Path
              d="M 15 17 C 18 12, 24 9.5, 31 9.5"
              stroke={RIM}
              strokeWidth={2}
              fill="none"
              opacity={0.55}
              strokeLinecap="round"
            />
          </G>

          {/* Rostrum as a soft translucent spike fading toward the tip. */}
          <Path d="M 40 13 L 51 8" stroke={GLOW} strokeWidth={2.6} strokeLinecap="round" opacity={0.2} />
          <Path d="M 40 13 L 51 8" stroke={CORAL} strokeWidth={1.3} strokeLinecap="round" opacity={0.65} />

          {/* Eye with a soft socket glow instead of a hard ring. */}
          <Ellipse cx={37} cy={16} rx={3.4} ry={3.6} fill={SHEEN} opacity={0.35} />
          <Ellipse cx={37} cy={16} rx={2.6} ry={2.8} fill={BAND} opacity={0.9} />
          <Ellipse cx={37.4} cy={16} rx={1.5} ry={1.7} fill="#3a1008" />
          <Ellipse cx={36.8} cy={15.4} rx={0.6} ry={0.7} fill="#fff" opacity={0.9} />
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
          <Defs>
            {/* Antennae fade to nothing at their tips. */}
            <LinearGradient id="shrimp-antenna" x1="0" y1="0.5" x2="1" y2="0.5">
              <Stop offset="0" stopColor={CORAL_LIGHT} stopOpacity={0.9} />
              <Stop offset="1" stopColor={CORAL_LIGHT} stopOpacity={0.1} />
            </LinearGradient>
          </Defs>
          <Path d="M 0 14 C 9 8, 17 5, 27 3" stroke={GLOW} strokeWidth={2.6} fill="none" strokeLinecap="round" opacity={0.15} />
          <Path d="M 0 17 C 9 15, 18 14, 27 11" stroke={GLOW} strokeWidth={2.4} fill="none" strokeLinecap="round" opacity={0.15} />
          <Path d="M 0 14 C 9 8, 17 5, 27 3" stroke="url(#shrimp-antenna)" strokeWidth={1.3} fill="none" strokeLinecap="round" />
          <Path d="M 0 17 C 9 15, 18 14, 27 11" stroke="url(#shrimp-antenna)" strokeWidth={1.1} fill="none" strokeLinecap="round" opacity={0.85} />
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
