import { Animated, StyleSheet } from 'react-native';
import Svg, { Defs, Ellipse, RadialGradient, Stop } from 'react-native-svg';

import { useOscillation } from '../hooks/useOscillation';

// Slightly taller than wide, like a roe egg.
const ASPECT = 0.8;

const SHELL_LIGHT = '#fff4e8';
const SHELL = '#ffd9b0';
const SHELL_DEEP = '#e79a63';
const YOLK = '#ff9a52';
const GLOW = '#ffcf9a';

// A translucent egg with a warm yolk core, gently drifting as it incubates.
export function Egg({ size = 72 }: { size?: number }) {
  const width = size * ASPECT;
  const drift = useOscillation(2600);

  const bob = drift.interpolate({ inputRange: [0, 1], outputRange: [-3, 3] });
  const sway = drift.interpolate({ inputRange: [0, 1], outputRange: ['-4deg', '4deg'] });

  return (
    <Animated.View
      accessibilityLabel="Egg"
      style={[
        styles.egg,
        { width, height: size, transform: [{ translateY: bob }, { rotate: sway }] },
      ]}
      pointerEvents="none"
    >
      <Svg width={width} height={size} viewBox="0 0 40 50">
        <Defs>
          <RadialGradient id="egg-halo" cx="50%" cy="50%" r="50%">
            <Stop offset="0.55" stopColor={GLOW} stopOpacity={0.35} />
            <Stop offset="1" stopColor={GLOW} stopOpacity={0} />
          </RadialGradient>
          <RadialGradient id="egg-shell" cx="38%" cy="30%" r="80%">
            <Stop offset="0" stopColor={SHELL_LIGHT} />
            <Stop offset="0.55" stopColor={SHELL} />
            <Stop offset="1" stopColor={SHELL_DEEP} />
          </RadialGradient>
          <RadialGradient id="egg-yolk" cx="50%" cy="55%" r="45%">
            <Stop offset="0" stopColor={YOLK} stopOpacity={0.85} />
            <Stop offset="1" stopColor={YOLK} stopOpacity={0} />
          </RadialGradient>
          <RadialGradient id="egg-sheen" cx="36%" cy="26%" r="35%">
            <Stop offset="0" stopColor="#ffffff" stopOpacity={0.9} />
            <Stop offset="1" stopColor="#ffffff" stopOpacity={0} />
          </RadialGradient>
        </Defs>

        <Ellipse cx={20} cy={25} rx={22} ry={27} fill="url(#egg-halo)" />
        <Ellipse cx={20} cy={26} rx={15} ry={20} fill="url(#egg-shell)" />
        <Ellipse cx={20} cy={28} rx={9} ry={11} fill="url(#egg-yolk)" />
        <Ellipse cx={15} cy={17} rx={5} ry={6} fill="url(#egg-sheen)" />
      </Svg>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  egg: {
    alignItems: 'center',
    justifyContent: 'center',
  },
});
