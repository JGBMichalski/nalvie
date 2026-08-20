import { StyleSheet, View } from 'react-native';

import { LinearGradient } from 'expo-linear-gradient';

import { theme } from '../theme';

// Full-bleed dark backdrop the tank renders inside.
export function TankBackdrop({ children }: { children: React.ReactNode }) {
  return (
    <LinearGradient
      colors={[theme.colors.tankBackgroundFrom, theme.colors.tankBackgroundTo]}
      style={styles.fill}
    >
      <View style={styles.fill}>{children}</View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  fill: {
    flex: 1,
  },
});
