import { useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useTheme } from '../lib/ThemeProvider';

// Shared shell for screens whose real content lands with a later spec
export function PlaceholderScreen({ title }: { title: string }) {
  const theme = useTheme();
  const styles = useMemo(
    () =>
      StyleSheet.create({
        container: {
          flex: 1,
          backgroundColor: theme.colors.tankBackgroundTo,
        },
        content: {
          padding: 20,
        },
        title: {
          color: theme.colors.textPrimary,
          fontSize: 22,
          fontWeight: '600',
        },
      }),
    [theme],
  );

  return (
    <View style={styles.container}>
      <SafeAreaView edges={['top', 'bottom']} style={styles.content}>
        <Text style={styles.title}>{title}</Text>
      </SafeAreaView>
    </View>
  );
}
