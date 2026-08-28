import { Animated, StyleSheet, View } from 'react-native';
import Svg, {
  Circle,
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

// Head, snout and trunk as one tapering silhouette: thick through the chest,
// narrowing toward where the tail takes over.
const TRUNK =
  'M 22 7 C 27 4, 31 7, 32 11 L 42 14 L 43 16.5 L 32 16 C 31 19, 32 22, 33 26 C 35 32, 33 40, 28 46 L 22 49 C 19 44, 18 36, 19 28 C 20 20, 19 12, 22 7 Z';
const CORONET = 'M 18.5 9 C 17.5 3, 21 1.5, 22 6 C 23.5 1, 26.5 3, 25 8.5 Z';
const DORSAL = 'M 19 27 C 12 29, 9.5 35, 12 42 C 15.5 42, 18.5 38, 19.5 33 Z';
const PECTORAL = 'M 30 18.5 C 34.5 19.5, 35.5 25, 32 27.5 C 29 26, 28 21.5, 30 18.5 Z';

// Painterly / soft-gradient palette: airbrushed volume + halo glow, no outlines.
const GOLD_LIGHT = '#ffedb8';
const GOLD = '#f5b942';
const GOLD_DEEP = '#a35f14';
const BELLY_SHADE = '#6e3d0a';
const BAND = '#fff6dd';
const SHEEN = '#ffefc4';
const RIM = '#ffe6a3';
const GLOW = '#ffc95e';

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
          <Defs>
            {/* Fin membrane fades toward its free edge. */}
            <LinearGradient id="seahorse-dorsal-fill" x1="1" y1="0" x2="0" y2="1">
              <Stop offset="0" stopColor={GOLD_LIGHT} />
              <Stop offset="1" stopColor={GOLD} stopOpacity={0.25} />
            </LinearGradient>
          </Defs>
          <Path d={DORSAL} fill="url(#seahorse-dorsal-fill)" />
          {/* Soft ray sheens, feathered by opacity instead of drawn lines. */}
          <Path d="M 18 29 C 14 33, 13 38, 14 41" stroke={SHEEN} strokeWidth={1.8} fill="none" opacity={0.3} strokeLinecap="round" />
          <Path d="M 18.5 32 C 16 35, 15.5 38, 16 40" stroke={SHEEN} strokeWidth={1.6} fill="none" opacity={0.3} strokeLinecap="round" />
        </Svg>
      </Animated.View>

      <Animated.View
        style={[styles.part, { transformOrigin: '46% 60%' }, { transform: [{ rotate: tailCurl }] }]}
      >
        <Svg width={size} height={height} viewBox="0 0 46 78">
          <Defs>
            {/* Each segment gets its own airbrushed volume, lit upper-left. */}
            <RadialGradient id="seahorse-tail" cx="38%" cy="30%" r="80%">
              <Stop offset="0" stopColor={GOLD_LIGHT} />
              <Stop offset="0.55" stopColor={GOLD} />
              <Stop offset="1" stopColor={GOLD_DEEP} />
            </RadialGradient>
            <RadialGradient id="seahorse-tail-glow" cx="50%" cy="50%" r="50%">
              <Stop offset="0.5" stopColor={GLOW} stopOpacity={0.25} />
              <Stop offset="1" stopColor={GLOW} stopOpacity={0} />
            </RadialGradient>
          </Defs>
          {/* Halo behind the coil so it glows as one soft mass. */}
          <Circle cx={23} cy={60.5} r={17} fill="url(#seahorse-tail-glow)" />
          {TAIL_SEGMENTS.map((segment, index) => (
            <Circle
              key={index}
              cx={segment.cx}
              cy={segment.cy}
              r={segment.r}
              fill="url(#seahorse-tail)"
            />
          ))}
        </Svg>
      </Animated.View>

      <View style={styles.part}>
        <Svg width={size} height={height} viewBox="0 0 46 78">
          <Defs>
            <ClipPath id="seahorse-trunk">
              <Path d={TRUNK} />
            </ClipPath>
            {/* Light source upper-left: bright core rolling into deep shadow. */}
            <RadialGradient id="seahorse-body" cx="42%" cy="28%" r="90%">
              <Stop offset="0" stopColor={GOLD_LIGHT} />
              <Stop offset="0.5" stopColor={GOLD} />
              <Stop offset="1" stopColor={GOLD_DEEP} />
            </RadialGradient>
            {/* Counter-shading: the belly side falls into shadow. */}
            <LinearGradient id="seahorse-belly" x1="0" y1="0" x2="0" y2="1">
              <Stop offset="0.55" stopColor={BELLY_SHADE} stopOpacity={0} />
              <Stop offset="1" stopColor={BELLY_SHADE} stopOpacity={0.45} />
            </LinearGradient>
            <RadialGradient id="seahorse-sheen" cx="48%" cy="22%" r="42%">
              <Stop offset="0" stopColor={SHEEN} stopOpacity={0.8} />
              <Stop offset="1" stopColor={SHEEN} stopOpacity={0} />
            </RadialGradient>
            {/* Ambient halo so the seahorse glows against dark water. */}
            <RadialGradient id="seahorse-halo" cx="50%" cy="50%" r="50%">
              <Stop offset="0.55" stopColor={GLOW} stopOpacity={0.3} />
              <Stop offset="0.8" stopColor={GLOW} stopOpacity={0.12} />
              <Stop offset="1" stopColor={GLOW} stopOpacity={0} />
            </RadialGradient>
            {/* Coronet dissolves toward its crown tips. */}
            <LinearGradient id="seahorse-coronet-fill" x1="0" y1="1" x2="0" y2="0">
              <Stop offset="0" stopColor={GOLD} />
              <Stop offset="1" stopColor={GOLD_LIGHT} stopOpacity={0.45} />
            </LinearGradient>
          </Defs>

          {/* Layered halo glow: concentric silhouettes scaled about the trunk centre. */}
          <Path d={TRUNK} fill="url(#seahorse-halo)" transform="translate(28 27) scale(1.2) translate(-28 -27)" />
          <Path d={TRUNK} fill={GLOW} opacity={0.14} transform="translate(28 27) scale(1.1) translate(-28 -27)" />

          <Path d={CORONET} fill="url(#seahorse-coronet-fill)" />
          <Path d={TRUNK} fill="url(#seahorse-body)" />
          <G clipPath="url(#seahorse-trunk)">
            <Path d={TRUNK} fill="url(#seahorse-belly)" />
            {/* Bony ring plates as feathered bands: wide-and-faint to narrow-and-bright. */}
            <Path d="M 20 21 C 24 22.5, 28 22.5, 31.5 21" stroke={BAND} strokeWidth={4.5} fill="none" opacity={0.15} />
            <Path d="M 19 28 C 23 29.5, 28 29.5, 33 28" stroke={BAND} strokeWidth={4.5} fill="none" opacity={0.15} />
            <Path d="M 19 35 C 23 36.5, 28 36.5, 34 35" stroke={BAND} strokeWidth={4.5} fill="none" opacity={0.15} />
            <Path d="M 20 42 C 23 43.5, 27 43.5, 31 41.5" stroke={BAND} strokeWidth={4} fill="none" opacity={0.15} />
            <Path d="M 20 21 C 24 22.5, 28 22.5, 31.5 21" stroke={BAND} strokeWidth={2.6} fill="none" opacity={0.3} />
            <Path d="M 19 28 C 23 29.5, 28 29.5, 33 28" stroke={BAND} strokeWidth={2.6} fill="none" opacity={0.3} />
            <Path d="M 19 35 C 23 36.5, 28 36.5, 34 35" stroke={BAND} strokeWidth={2.6} fill="none" opacity={0.3} />
            <Path d="M 20 42 C 23 43.5, 27 43.5, 31 41.5" stroke={BAND} strokeWidth={2.4} fill="none" opacity={0.3} />
            <Path d="M 20 21 C 24 22.5, 28 22.5, 31.5 21" stroke={BAND} strokeWidth={1.2} fill="none" opacity={0.7} />
            <Path d="M 19 28 C 23 29.5, 28 29.5, 33 28" stroke={BAND} strokeWidth={1.2} fill="none" opacity={0.7} />
            <Path d="M 19 35 C 23 36.5, 28 36.5, 34 35" stroke={BAND} strokeWidth={1.2} fill="none" opacity={0.7} />
            <Path d="M 20 42 C 23 43.5, 27 43.5, 31 41.5" stroke={BAND} strokeWidth={1.1} fill="none" opacity={0.7} />
            {/* Spiny back ridge as soft feathered ticks. */}
            <Path d="M 19.5 24 L 17.5 23 M 18.5 31 L 16.5 30 M 18.5 38 L 16.5 37.5" stroke={RIM} strokeWidth={2.4} strokeLinecap="round" opacity={0.18} />
            <Path d="M 19.5 24 L 17.5 23 M 18.5 31 L 16.5 30 M 18.5 38 L 16.5 37.5" stroke={RIM} strokeWidth={1.1} strokeLinecap="round" opacity={0.5} />
            {/* Sheen over the chest, then a rim light tracing the lit edge. */}
            <Path d={TRUNK} fill="url(#seahorse-sheen)" />
            <Path
              d="M 21 10 C 25 6.5, 29 7.5, 31.5 11"
              stroke={RIM}
              strokeWidth={1.8}
              fill="none"
              opacity={0.55}
              strokeLinecap="round"
            />
          </G>

          {/* Eye with a soft socket glow instead of a hard ring. */}
          <Ellipse cx={27} cy={12} rx={4} ry={4.2} fill={SHEEN} opacity={0.35} />
          <Ellipse cx={27} cy={12} rx={3} ry={3.2} fill={BAND} opacity={0.95} />
          <Circle cx={27.6} cy={12} r={1.5} fill="#2c1c05" />
          <Circle cx={27} cy={11.3} r={0.6} fill="#fff" opacity={0.9} />
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
          <Defs>
            {/* Pectoral membrane fades away from its base. */}
            <LinearGradient id="seahorse-pectoral-fill" x1="0" y1="0" x2="1" y2="1">
              <Stop offset="0" stopColor={GOLD_LIGHT} stopOpacity={0.9} />
              <Stop offset="1" stopColor={GOLD} stopOpacity={0.3} />
            </LinearGradient>
          </Defs>
          <Path d={PECTORAL} fill="url(#seahorse-pectoral-fill)" />
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
