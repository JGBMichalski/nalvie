import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Link } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';

import { GlassPanel } from '../components/GlassPanel';
import { theme } from '../theme';

// Secondary navigation, per Variant B: no persistent tab bar, a menu instead.
export default function MenuScreen() {
  return (
    <View style={styles.container}>
      <SafeAreaView edges={['top', 'bottom']} style={styles.content}>
        <Link href="/stats" asChild>
          <Pressable>
            <GlassPanel style={styles.item}>
              <Text style={styles.itemText}>Stats</Text>
            </GlassPanel>
          </Pressable>
        </Link>
        <Link href="/settings" asChild>
          <Pressable>
            <GlassPanel style={styles.item}>
              <Text style={styles.itemText}>Settings</Text>
            </GlassPanel>
          </Pressable>
        </Link>
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
    gap: 12,
  },
  item: {
    paddingVertical: 16,
  },
  itemText: {
    color: theme.colors.textPrimary,
    fontSize: 16,
    fontWeight: '600',
  },
});
