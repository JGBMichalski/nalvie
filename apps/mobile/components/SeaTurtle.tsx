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

const SHELL = 'M 8 30 C 8 16, 22 8, 38 8 C 54 8, 66 16, 66 30 C 66 44, 54 52, 38 52 C 22 52, 8 44, 8 30 Z';

// Painterly palette: airbrushed radial volume, counter-shading, soft glow —
// no hard outlines.
const SHELL_LIGHT = '#9fd8ae';
const SHELL_MID = '#3f7d53';
const SHELL_DEEP = '#1e4530';
const UNDER_SHADE = '#12301f';
const SKIN_LIGHT = '#7cc294';
const SKIN = '#4a9163';
const SKIN_DEEP = '#2b5c3f';
const SCUTE = '#c9f0d5';
const SHEEN = '#dff5e5';
const RIM = '#bce9c9';
const GLOW = '#5fbf83';

const WIDTH = 84;
const HEIGHT = 60;

export function SeaTurtle({ size = 72 }: { size?: number }) {
  const scale = size / WIDTH;
  const height = HEIGHT * scale;

  // Sea turtles fly rather than swim — slow front-flipper downstrokes, with the
  // rear flippers barely moving as trim.
  const stroke = useOscillation(1300);
  const rear = useOscillation(2100);
  const glide = useOscillation(3600);

  const frontFlipper = stroke.interpolate({ inputRange: [0, 1], outputRange: ['-26deg', '18deg'] });
  const rearFlipper = rear.interpolate({ inputRange: [0, 1], outputRange: ['-7deg', '7deg'] });
  const headBob = stroke.interpolate({ inputRange: [0, 1], outputRange: [1.5, -1.5] });
  const bob = glide.interpolate({ inputRange: [0, 1], outputRange: [-4, 4] });
  const tilt = glide.interpolate({ inputRange: [0, 1], outputRange: ['3deg', '-3deg'] });

  return (
    <Animated.View
      accessibilityLabel="Sea Turtle"
      style={[{ width: size, height }, { transform: [{ translateY: bob }, { rotate: tilt }] }]}
      pointerEvents="none"
    >
      <Animated.View
        style={[
          styles.part,
          { transformOrigin: '30% 72%' },
          { transform: [{ rotate: rearFlipper }] },
        ]}
      >
        <Svg width={size} height={height} viewBox="0 0 84 60">
          <Defs>
            {/* Flippers dissolve toward their tips like an airbrush stroke. */}
            <LinearGradient id="turtle-rear-fill" x1="1" y1="0" x2="0" y2="1">
              <Stop offset="0" stopColor={SKIN} />
              <Stop offset="0.65" stopColor={SKIN_DEEP} />
              <Stop offset="1" stopColor={SKIN_DEEP} stopOpacity={0.35} />
            </LinearGradient>
          </Defs>
          <Path d="M 20 44 C 12 50, 6 56, 9 58 C 15 58, 22 53, 26 48 Z" fill="url(#turtle-rear-fill)" />
          <Path d="M 12 26 C 4 24, 0 20, 2 17 C 8 17, 15 21, 18 25 Z" fill="url(#turtle-rear-fill)" />
        </Svg>
      </Animated.View>

      {/* Rear-left flipper sits behind the shell, so the near flipper reads as closer. */}
      <Animated.View
        style={[
          styles.part,
          { transformOrigin: '62% 30%' },
          { transform: [{ rotate: frontFlipper }] },
        ]}
      >
        <Svg width={size} height={height} viewBox="0 0 84 60">
          <Defs>
            <LinearGradient id="turtle-farfin-fill" x1="0" y1="1" x2="0.6" y2="0">
              <Stop offset="0" stopColor={SKIN} />
              <Stop offset="0.6" stopColor={SKIN_DEEP} />
              <Stop offset="1" stopColor={SKIN_DEEP} stopOpacity={0.4} />
            </LinearGradient>
          </Defs>
          <Path d="M 50 18 C 54 6, 62 0, 68 2 C 68 10, 61 18, 54 22 Z" fill="url(#turtle-farfin-fill)" opacity={0.85} />
        </Svg>
      </Animated.View>

      <View style={styles.part}>
        <Svg width={size} height={height} viewBox="0 0 84 60">
          <Defs>
            <ClipPath id="turtle-shell-clip">
              <Path d={SHELL} />
            </ClipPath>
            {/* Light source upper-left: bright core rolling into deep shadow. */}
            <RadialGradient id="turtle-shell" cx="38%" cy="26%" r="85%">
              <Stop offset="0" stopColor={SHELL_LIGHT} />
              <Stop offset="0.5" stopColor={SHELL_MID} />
              <Stop offset="1" stopColor={SHELL_DEEP} />
            </RadialGradient>
            {/* Counter-shading: shell underside falls into shadow. */}
            <LinearGradient id="turtle-under" x1="0" y1="0" x2="0" y2="1">
              <Stop offset="0.55" stopColor={UNDER_SHADE} stopOpacity={0} />
              <Stop offset="1" stopColor={UNDER_SHADE} stopOpacity={0.45} />
            </LinearGradient>
            <RadialGradient id="turtle-sheen" cx="36%" cy="24%" r="45%">
              <Stop offset="0" stopColor={SHEEN} stopOpacity={0.8} />
              <Stop offset="1" stopColor={SHEEN} stopOpacity={0} />
            </RadialGradient>
            {/* Ambient halo so the turtle reads lit against dark water. */}
            <RadialGradient id="turtle-halo" cx="50%" cy="50%" r="50%">
              <Stop offset="0.55" stopColor={GLOW} stopOpacity={0.28} />
              <Stop offset="0.8" stopColor={GLOW} stopOpacity={0.1} />
              <Stop offset="1" stopColor={GLOW} stopOpacity={0} />
            </RadialGradient>
            <RadialGradient id="turtle-head-fill" cx="38%" cy="30%" r="80%">
              <Stop offset="0" stopColor={SKIN_LIGHT} />
              <Stop offset="0.55" stopColor={SKIN} />
              <Stop offset="1" stopColor={SKIN_DEEP} />
            </RadialGradient>
          </Defs>

          {/* Layered halo glow, scaled about the shell centre (37, 30). */}
          <Path d={SHELL} fill="url(#turtle-halo)" transform="translate(37 30) scale(1.2) translate(-37 -30)" />
          <Path d={SHELL} fill={GLOW} opacity={0.12} transform="translate(37 30) scale(1.08) translate(-37 -30)" />

          {/* Head and neck. */}
          <Path d="M 62 26 C 70 22, 79 24, 81 30 C 79 36, 70 38, 62 34 Z" fill="url(#turtle-head-fill)" />
          {/* Eye: soft socket glow, light disc, pupil, specular dot. */}
          <Ellipse cx={75} cy={28} rx={3} ry={3.2} fill={SHEEN} opacity={0.35} />
          <Ellipse cx={75} cy={28} rx={2.3} ry={2.5} fill={SCUTE} opacity={0.9} />
          <Ellipse cx={75.3} cy={28.1} rx={1.4} ry={1.6} fill="#12210f" />
          <Ellipse cx={74.8} cy={27.5} rx={0.5} ry={0.55} fill="#fff" opacity={0.9} />

          <Path d={SHELL} fill="url(#turtle-shell)" />
          <G clipPath="url(#turtle-shell-clip)">
            <Path d={SHELL} fill="url(#turtle-under)" />
            {/* Feathered scutes: stacked strokes wide-and-faint to narrow-and-bright. */}
            <Path d="M 24 16 L 20 30 L 26 44 M 40 10 L 36 30 L 42 50 M 56 13 L 53 30 L 58 47" stroke={SCUTE} strokeWidth={4.2} fill="none" opacity={0.12} />
            <Path d="M 10 24 C 26 20, 48 20, 64 23 M 10 37 C 26 41, 48 41, 64 38" stroke={SCUTE} strokeWidth={4.2} fill="none" opacity={0.12} />
            <Path d="M 24 16 L 20 30 L 26 44 M 40 10 L 36 30 L 42 50 M 56 13 L 53 30 L 58 47" stroke={SCUTE} strokeWidth={2.4} fill="none" opacity={0.25} />
            <Path d="M 10 24 C 26 20, 48 20, 64 23 M 10 37 C 26 41, 48 41, 64 38" stroke={SCUTE} strokeWidth={2.4} fill="none" opacity={0.25} />
            <Path d="M 24 16 L 20 30 L 26 44 M 40 10 L 36 30 L 42 50 M 56 13 L 53 30 L 58 47" stroke={SCUTE} strokeWidth={1.2} fill="none" opacity={0.55} />
            <Path d="M 10 24 C 26 20, 48 20, 64 23 M 10 37 C 26 41, 48 41, 64 38" stroke={SCUTE} strokeWidth={1.2} fill="none" opacity={0.55} />
            {/* Sheen on the upper carapace, then a rim light tracing the lit edge. */}
            <Path d={SHELL} fill="url(#turtle-sheen)" />
            <Path d="M 10 24 C 13 14, 25 8.5, 38 8.5" stroke={RIM} strokeWidth={2.2} fill="none" opacity={0.55} strokeLinecap="round" />
          </G>
        </Svg>
      </View>

      {/* Near front flipper, in front of the shell. */}
      <Animated.View
        style={[
          styles.part,
          { transformOrigin: '62% 62%' },
          { transform: [{ rotate: frontFlipper }, { translateY: headBob }] },
        ]}
      >
        <Svg width={size} height={height} viewBox="0 0 84 60">
          <Defs>
            <LinearGradient id="turtle-nearfin-fill" x1="0" y1="0" x2="0.6" y2="1">
              <Stop offset="0" stopColor={SKIN_LIGHT} />
              <Stop offset="0.55" stopColor={SKIN} />
              <Stop offset="1" stopColor={SKIN_DEEP} stopOpacity={0.45} />
            </LinearGradient>
          </Defs>
          <Path d="M 50 40 C 55 52, 63 58, 69 56 C 69 48, 61 40, 54 37 Z" fill="url(#turtle-nearfin-fill)" />
          {/* Soft edge highlight along the fin's leading edge. */}
          <Path d="M 52 39 C 57 43, 62 48, 66 53" stroke={SHEEN} strokeWidth={1.8} fill="none" opacity={0.3} strokeLinecap="round" />
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
