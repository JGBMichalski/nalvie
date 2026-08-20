import { StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { theme } from '../theme';

// Shared shell for screens whose real content lands with a later spec
export function PlaceholderScreen({ title }: { title: string }) {
  return (
    <View style={styles.container}>
      <SafeAreaView edges={['top', 'bottom']} style={styles.content}>
        <Text style={styles.title}>{title}</Text>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
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
});
