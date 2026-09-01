import { Animated, StyleSheet, View } from 'react-native';
import Svg, { Defs, Ellipse, LinearGradient as SvgLinearGradient, Path, RadialGradient, Stop } from 'react-native-svg';

import { LinearGradient } from 'expo-linear-gradient';
import { tankThemeById, type TankThemePalette } from '@nalvie/core';

import { useTankThemeId } from '../lib/ThemeProvider';
import { useOscillation } from '../hooks/useOscillation';

// The drift loops are pure decoration, but under Jest's fake timers a long
// advanceTimersByTime replays every 16ms frame of every mounted Animated loop —
// a 25-minute session test would grind through ~94k frames. Skip them in tests.
const AMBIENT_ANIMATION = process.env.NODE_ENV !== 'test';

function LightShafts({ palette }: { palette: TankThemePalette }) {
  const drift = useOscillation(9000);
  const breathe = useOscillation(6500);

  const sway = drift.interpolate({ inputRange: [0, 1], outputRange: [-14, 14] });
  const glow = breathe.interpolate({ inputRange: [0, 1], outputRange: [0.5, 1] });

  return (
    <Animated.View
      style={[StyleSheet.absoluteFill, { opacity: glow, transform: [{ translateX: sway }] }]}
      pointerEvents="none"
    >
      <Svg style={StyleSheet.absoluteFill} viewBox="0 0 100 200" preserveAspectRatio="xMidYMin slice">
        <Defs>
          {/* Shafts dissolve with depth the way the fish fins dissolve at their tips. */}
          <SvgLinearGradient id="tank-shaft" x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0" stopColor={palette.shaft} stopOpacity={0.16} />
            <Stop offset="0.55" stopColor={palette.shaft} stopOpacity={0.05} />
            <Stop offset="1" stopColor={palette.shaft} stopOpacity={0} />
          </SvgLinearGradient>
        </Defs>
        <Path d="M 22 0 L 40 0 L 58 150 L 30 150 Z" fill="url(#tank-shaft)" />
        <Path d="M 52 0 L 62 0 L 86 130 L 70 130 Z" fill="url(#tank-shaft)" opacity={0.7} />
      </Svg>
    </Animated.View>
  );
}

function Motes({ palette }: { palette: TankThemePalette }) {
  const rise = useOscillation(11000);

  const lift = rise.interpolate({ inputRange: [0, 1], outputRange: [10, -14] });
  const fade = rise.interpolate({ inputRange: [0, 0.5, 1], outputRange: [0.2, 0.6, 0.15] });

  return (
    <Animated.View
      style={[StyleSheet.absoluteFill, { opacity: fade, transform: [{ translateY: lift }] }]}
      pointerEvents="none"
    >
      <Svg style={StyleSheet.absoluteFill} viewBox="0 0 100 200" preserveAspectRatio="xMidYMid slice">
        {/* Suspended particles catching the light — soft dots, no outlines. */}
        <Ellipse cx={24} cy={70} rx={1.1} ry={1.1} fill={palette.mote} opacity={0.5} />
        <Ellipse cx={31} cy={112} rx={0.7} ry={0.7} fill={palette.mote} opacity={0.35} />
        <Ellipse cx={58} cy={58} rx={0.8} ry={0.8} fill={palette.mote} opacity={0.45} />
        <Ellipse cx={72} cy={96} rx={1.2} ry={1.2} fill={palette.mote} opacity={0.4} />
        <Ellipse cx={83} cy={64} rx={0.6} ry={0.6} fill={palette.mote} opacity={0.3} />
        <Ellipse cx={46} cy={132} rx={0.9} ry={0.9} fill={palette.mote} opacity={0.3} />
      </Svg>
    </Animated.View>
  );
}

// Full-bleed backdrop the tank renders inside.
export function TankBackdrop({ children }: { children: React.ReactNode }) {
  const tankThemeId = useTankThemeId();
  const palette = tankThemeById(tankThemeId).palette;
  return (
    <LinearGradient
      colors={[palette.waterFrom, palette.waterMid, palette.waterTo]}
      style={styles.fill}
    >
      <Svg
        style={StyleSheet.absoluteFill}
        viewBox="0 0 100 200"
        preserveAspectRatio="xMidYMax slice"
        pointerEvents="none"
      >
        <Defs>
          {/* Sunlight blooming down from the surface. */}
          <RadialGradient id="tank-sunglow" cx="50%" cy="0%" r="75%">
            <Stop offset="0" stopColor={palette.sunglow} stopOpacity={0.22} />
            <Stop offset="0.5" stopColor={palette.sunglow} stopOpacity={0.07} />
            <Stop offset="1" stopColor={palette.sunglow} stopOpacity={0} />
          </RadialGradient>
          {/* Dunes carry the same upper-left-lit radial volume as the creatures. */}
          <RadialGradient id="tank-dune-far" cx="35%" cy="20%" r="90%">
            <Stop offset="0" stopColor={palette.duneLight} stopOpacity={0.55} />
            <Stop offset="1" stopColor={palette.dune} stopOpacity={0.55} />
          </RadialGradient>
          <RadialGradient id="tank-dune-near" cx="35%" cy="15%" r="95%">
            <Stop offset="0" stopColor={palette.duneLight} />
            <Stop offset="0.6" stopColor={palette.dune} />
            <Stop offset="1" stopColor={palette.duneDeep} />
          </RadialGradient>
          {/* Edge vignette pulls the eye to the lit centre of the water column. */}
          <RadialGradient id="tank-vignette" cx="50%" cy="45%" r="75%">
            <Stop offset="0.6" stopColor={palette.duneDeep} stopOpacity={0} />
            <Stop offset="1" stopColor={palette.duneDeep} stopOpacity={0.5} />
          </RadialGradient>
        </Defs>

        <Path d="M 0 0 H 100 V 90 H 0 Z" fill="url(#tank-sunglow)" />

        {/* Far dune line, hazy with distance. */}
        <Path d="M 0 176 C 18 168, 34 172, 50 169 C 68 166, 84 171, 100 167 L 100 200 L 0 200 Z" fill="url(#tank-dune-far)" />
        {/* Near dunes: feathered crest highlights instead of contour lines. */}
        <Path d="M 0 186 C 20 176, 42 182, 60 178 C 78 174, 90 180, 100 177 L 100 200 L 0 200 Z" fill="url(#tank-dune-near)" />
        <Path d="M 0 186 C 20 176, 42 182, 60 178" stroke={palette.duneLight} strokeWidth={2.4} opacity={0.18} fill="none" strokeLinecap="round" />
        <Path d="M 0 186 C 20 176, 42 182, 60 178" stroke={palette.sunglow} strokeWidth={1} opacity={0.22} fill="none" strokeLinecap="round" />

        <Path d="M 0 0 H 100 V 200 H 0 Z" fill="url(#tank-vignette)" />
      </Svg>

      {AMBIENT_ANIMATION && <LightShafts palette={palette} />}
      {AMBIENT_ANIMATION && <Motes palette={palette} />}

      <View style={styles.fill}>{children}</View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  fill: {
    flex: 1,
  },
});
