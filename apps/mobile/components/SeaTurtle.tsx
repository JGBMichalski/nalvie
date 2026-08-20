import { Animated, StyleSheet, View } from 'react-native';
import Svg, { Defs, Ellipse, LinearGradient, Path, Stop } from 'react-native-svg';

import { useOscillation } from '../hooks/useOscillation';

const SHELL = 'M 8 30 C 8 16, 22 8, 38 8 C 54 8, 66 16, 66 30 C 66 44, 54 52, 38 52 C 22 52, 8 44, 8 30 Z';

const OUTLINE = '#1f3524';
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
          <Path d="M 20 44 C 12 50, 6 56, 9 58 C 15 58, 22 53, 26 48 Z" fill="#3f7d53" stroke={OUTLINE} strokeWidth={1.7} strokeLinejoin="round" />
          <Path d="M 12 26 C 4 24, 0 20, 2 17 C 8 17, 15 21, 18 25 Z" fill="#3f7d53" stroke={OUTLINE} strokeWidth={1.7} strokeLinejoin="round" />
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
          <Path d="M 50 18 C 54 6, 62 0, 68 2 C 68 10, 61 18, 54 22 Z" fill="#4a9163" opacity={0.85} stroke={OUTLINE} strokeWidth={1.7} strokeLinejoin="round" />
        </Svg>
      </Animated.View>

      <View style={styles.part}>
        <Svg width={size} height={height} viewBox="0 0 84 60">
          <Defs>
            <LinearGradient id="turtle-shell" x1="0" y1="0" x2="0.3" y2="1">
              <Stop offset="0" stopColor="#6bbd84" />
              <Stop offset="0.55" stopColor="#3f7d53" />
              <Stop offset="1" stopColor="#27543a" />
            </LinearGradient>
          </Defs>

          {/* Head and neck. */}
          <Path d="M 62 26 C 70 22, 79 24, 81 30 C 79 36, 70 38, 62 34 Z" fill="#4a9163" stroke={OUTLINE} strokeWidth={1.8} strokeLinejoin="round" />
          <Ellipse cx={75} cy={28} rx={1.9} ry={2} fill="#12210f" />

          <Path d={SHELL} fill="url(#turtle-shell)" stroke={OUTLINE} strokeWidth={2.2} strokeLinejoin="round" />
          {/* Scutes. */}
          <Path d="M 24 16 L 20 30 L 26 44 M 40 10 L 36 30 L 42 50 M 56 13 L 53 30 L 58 47" stroke="#a8e0ba" strokeWidth={1.4} fill="none" opacity={0.45} />
          <Path d="M 10 24 C 26 20, 48 20, 64 23 M 10 37 C 26 41, 48 41, 64 38" stroke="#a8e0ba" strokeWidth={1.4} fill="none" opacity={0.45} />
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
          <Path d="M 50 40 C 55 52, 63 58, 69 56 C 69 48, 61 40, 54 37 Z" fill="#4a9163" stroke={OUTLINE} strokeWidth={1.8} strokeLinejoin="round" />
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
