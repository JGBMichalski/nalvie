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

const BODY =
  'M 4 20 C 6 12, 15 8, 26 9 C 36 10, 44 14, 46 20 C 44 26, 36 30, 26 31 C 15 32, 6 28, 4 20 Z';
// A guppy's defining feature: an oversized flowing fan tail.
const TAIL = 'M 26 20 C 19 4, 8 -1, 2 5 C 8 13, 8 27, 2 35 C 8 41, 19 36, 26 20 Z';
const DORSAL = 'M 14 11 C 20 3, 29 4, 33 10 Z';

// Painterly / soft-gradient palette: airbrushed volume + glow, no outlines.
const TEAL_LIGHT = '#b8fff0';
const TEAL = '#5eead4';
const TEAL_DEEP = '#0e7490';
const BELLY_SHADE = '#134e63';
const VIOLET = '#c084fc';
const PINK = '#f0709a';
const AMBER = '#ffb454';
const SHEEN = '#e9fdf7';
const RIM = '#d9fff4';
const GLOW = '#67e8f9';
const SPECKLE = '#fef9c3';

const ASPECT = 70 / 40;

export function Guppy({ size = 72 }: { size?: number }) {
  const height = size / ASPECT;
  // Guppies flutter that big tail faster than a clownfish flaps.
  const flutter = useOscillation(300);
  const swim = useOscillation(1900);

  const tailRotation = flutter.interpolate({
    inputRange: [0, 1],
    outputRange: ['-20deg', '20deg'],
  });
  const tailStretch = flutter.interpolate({ inputRange: [0, 1], outputRange: [0.88, 1.06] });
  const bob = swim.interpolate({ inputRange: [0, 1], outputRange: [-3, 3] });
  const tilt = swim.interpolate({ inputRange: [0, 1], outputRange: ['2.5deg', '-2.5deg'] });

  return (
    <Animated.View
      accessibilityLabel="Guppy"
      style={[
        { width: size, height },
        styles.fish,
        { transform: [{ translateY: bob }, { rotate: tilt }] },
      ]}
    >
      <Animated.View
        style={[
          styles.tail,
          { transform: [{ rotate: tailRotation }, { scaleY: tailStretch }] },
        ]}
        pointerEvents="none"
      >
        <Svg width={size * (28 / 70)} height={height} viewBox="0 0 28 40">
          <Defs>
            <LinearGradient id="guppy-tail" x1="1" y1="0" x2="0" y2="0">
              <Stop offset="0" stopColor={VIOLET} />
              <Stop offset="0.55" stopColor={PINK} />
              {/* Tail dissolves toward the tip like an airbrush stroke. */}
              <Stop offset="0.85" stopColor={AMBER} stopOpacity={0.85} />
              <Stop offset="1" stopColor={AMBER} stopOpacity={0.4} />
            </LinearGradient>
            <RadialGradient id="guppy-tail-glow" cx="80%" cy="50%" r="90%">
              <Stop offset="0" stopColor={PINK} stopOpacity={0.4} />
              <Stop offset="1" stopColor={PINK} stopOpacity={0} />
            </RadialGradient>
          </Defs>
          <Path d={TAIL} fill="url(#guppy-tail-glow)" transform="translate(14 20) scale(1.2) translate(-14 -20)" />
          <Path d={TAIL} fill="url(#guppy-tail)" />
          {/* Soft fin-ray sheen, feathered by opacity instead of drawn lines. */}
          <Path d="M 24 18 C 17 12, 10 7, 5 5" stroke="#ffe6c2" strokeWidth={2.2} fill="none" opacity={0.25} strokeLinecap="round" />
          <Path d="M 24 22 C 17 27, 10 32, 5 35" stroke="#ffe6c2" strokeWidth={2.2} fill="none" opacity={0.25} strokeLinecap="round" />
          <Path d="M 24 18 C 17 12, 10 7, 5 5" stroke="#ffe6c2" strokeWidth={1} fill="none" opacity={0.5} strokeLinecap="round" />
          <Path d="M 24 22 C 17 27, 10 32, 5 35" stroke="#ffe6c2" strokeWidth={1} fill="none" opacity={0.5} strokeLinecap="round" />
        </Svg>
      </Animated.View>

      <View style={styles.body} pointerEvents="none">
        <Svg width={size * (48 / 70)} height={height} viewBox="0 0 48 40">
          <Defs>
            <ClipPath id="guppy-body-clip">
              <Path d={BODY} />
            </ClipPath>
            {/* Light source upper-left: bright core rolling into deep shadow. */}
            <RadialGradient id="guppy-body-fill" cx="36%" cy="26%" r="85%">
              <Stop offset="0" stopColor={TEAL_LIGHT} />
              <Stop offset="0.5" stopColor={TEAL} />
              <Stop offset="1" stopColor={TEAL_DEEP} />
            </RadialGradient>
            {/* Counter-shading: belly falls into shadow so the form reads round. */}
            <LinearGradient id="guppy-belly" x1="0" y1="0" x2="0" y2="1">
              <Stop offset="0.55" stopColor={BELLY_SHADE} stopOpacity={0} />
              <Stop offset="1" stopColor={BELLY_SHADE} stopOpacity={0.45} />
            </LinearGradient>
            {/* Iridescence: a violet wash drifting over the rear flank. */}
            <LinearGradient id="guppy-iridescence" x1="0" y1="0" x2="1" y2="0">
              <Stop offset="0" stopColor={VIOLET} stopOpacity={0.45} />
              <Stop offset="0.55" stopColor={VIOLET} stopOpacity={0} />
            </LinearGradient>
            <RadialGradient id="guppy-sheen" cx="38%" cy="24%" r="45%">
              <Stop offset="0" stopColor={SHEEN} stopOpacity={0.8} />
              <Stop offset="1" stopColor={SHEEN} stopOpacity={0} />
            </RadialGradient>
            <RadialGradient id="guppy-halo" cx="50%" cy="50%" r="50%">
              <Stop offset="0.55" stopColor={GLOW} stopOpacity={0.28} />
              <Stop offset="0.8" stopColor={GLOW} stopOpacity={0.12} />
              <Stop offset="1" stopColor={GLOW} stopOpacity={0} />
            </RadialGradient>
            <RadialGradient id="guppy-dorsal-fill" cx="50%" cy="100%" r="100%">
              <Stop offset="0" stopColor={PINK} />
              <Stop offset="1" stopColor={VIOLET} stopOpacity={0.45} />
            </RadialGradient>
          </Defs>

          {/* Layered halo glow: concentric silhouettes scaled about the body centre. */}
          <Path d={BODY} fill="url(#guppy-halo)" transform="translate(25 20) scale(1.22) translate(-25 -20)" />
          <Path d={BODY} fill={GLOW} opacity={0.14} transform="translate(25 20) scale(1.1) translate(-25 -20)" />

          <Path d={DORSAL} fill="url(#guppy-dorsal-fill)" opacity={0.9} />

          <Path d={BODY} fill="url(#guppy-body-fill)" />
          <G clipPath="url(#guppy-body-clip)">
            <Path d={BODY} fill="url(#guppy-iridescence)" />
            <Path d={BODY} fill="url(#guppy-belly)" />
            {/* Speckles as soft feathered glows: wide-faint halo under a bright core. */}
            <Circle cx={18} cy={17} r={4.2} fill={SPECKLE} opacity={0.2} />
            <Circle cx={18} cy={17} r={2.2} fill={SPECKLE} opacity={0.85} />
            <Circle cx={24} cy={23} r={3.2} fill={SPECKLE} opacity={0.18} />
            <Circle cx={24} cy={23} r={1.6} fill={SPECKLE} opacity={0.7} />
            <Circle cx={13} cy={22} r={2.8} fill={SPECKLE} opacity={0.15} />
            <Circle cx={13} cy={22} r={1.4} fill={SPECKLE} opacity={0.6} />
            {/* Sheen over the upper flank, then a rim light on the lit edge. */}
            <Path d={BODY} fill="url(#guppy-sheen)" />
            <Path
              d="M 6 16 C 9 11, 17 8.5, 27 9.5"
              stroke={RIM}
              strokeWidth={2}
              fill="none"
              opacity={0.55}
              strokeLinecap="round"
            />
          </G>

          {/* Pelvic fin as a soft translucent form. */}
          <Path d="M 22 24 C 27 24, 30 27, 28 30 C 24 30, 22 27, 22 24 Z" fill={PINK} opacity={0.55} />

          {/* Eye with a soft socket glow instead of a hard ring. */}
          <Ellipse cx={38} cy={17} rx={4.6} ry={5} fill={SHEEN} opacity={0.35} />
          <Ellipse cx={38} cy={17} rx={3.4} ry={3.8} fill="#fdf6ec" opacity={0.95} />
          <Ellipse cx={39} cy={17} rx={1.7} ry={2} fill="#10202b" />
          <Ellipse cx={38.3} cy={16.3} rx={0.7} ry={0.8} fill="#fff" opacity={0.9} />
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
    marginLeft: -6,
  },
});
