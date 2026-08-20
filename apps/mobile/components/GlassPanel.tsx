import { StyleSheet, View, type ViewProps } from 'react-native';

import { theme } from '../theme';

// Translucent "glass" chrome used for stats/streak/timer overlays on top
// of the full-bleed tank background (Variant B design direction).
export function GlassPanel({ style, ...props }: ViewProps) {
  return <View style={[styles.panel, style]} {...props} />;
}

const styles = StyleSheet.create({
  panel: {
    backgroundColor: theme.colors.glassBackground,
    borderColor: theme.colors.glassBorder,
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: theme.radii.glass,
    paddingVertical: 10,
    paddingHorizontal: 16,
  },
});
