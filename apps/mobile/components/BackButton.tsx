import { useMemo } from 'react';
import { Pressable, StyleSheet } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

import { useTheme } from '../lib/ThemeProvider';

// A back button for screens reached by pushing a route (Stats, Settings) —
// with the system nav bar hidden (see app/_layout.tsx), these need their
// own explicit way back rather than relying on a hidden bar's gesture.
export function BackButton() {
  const theme = useTheme();
  const styles = useMemo(
    () =>
      StyleSheet.create({
        button: {
          width: 36,
          height: 36,
          borderRadius: 18,
          backgroundColor: theme.colors.glassBackground,
          borderColor: theme.colors.glassBorder,
          borderWidth: StyleSheet.hairlineWidth,
          alignItems: 'center',
          justifyContent: 'center',
        },
      }),
    [theme],
  );

  return (
    <Pressable
      style={styles.button}
      onPress={() => router.back()}
      hitSlop={8}
      accessibilityLabel="Back"
      accessibilityRole="button"
    >
      <Ionicons name="chevron-back" size={22} color={theme.colors.textPrimary} />
    </Pressable>
  );
}
