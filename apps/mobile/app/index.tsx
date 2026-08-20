import { Pressable, StyleSheet, Text } from 'react-native';
import { Link } from 'expo-router';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

import { GlassPanel } from '../components/GlassPanel';
import { PlayIcon } from '../components/PlayIcon';
import { TankBackdrop } from '../components/TankBackdrop';
import { theme } from '../theme';

// Home/Tank: the app's default screen. Full-bleed tank background, glass
// overlay for stats, FAB for starting a session.
export default function HomeScreen() {
  const insets = useSafeAreaInsets();

  return (
    <TankBackdrop>
      <SafeAreaView style={styles.overlay} edges={['top', 'bottom']}>
        <GlassPanel style={styles.streak}>
          <Text style={styles.glassText}>Tank coming soon</Text>
        </GlassPanel>

        <Link href="/menu" asChild>
          <Pressable
            style={StyleSheet.flatten([
              styles.menuButton,
              { top: insets.top + 20 },
            ])}
            hitSlop={8}
            accessibilityLabel="Open menu"
          >
            <Text style={styles.menuIcon}>☰</Text>
          </Pressable>
        </Link>

        <Pressable
          style={StyleSheet.flatten([styles.fab, { bottom: insets.bottom + 28 }])}
          disabled
          accessibilityLabel="Start a session"
        >
          <PlayIcon size={30} color={theme.colors.fabIcon} />
        </Pressable>
      </SafeAreaView>
    </TankBackdrop>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    padding: 20,
  },
  streak: {
    alignSelf: 'flex-start',
  },
  glassText: {
    color: theme.colors.glassText,
    fontSize: 13,
  },
  menuButton: {
    position: 'absolute',
    right: 20,
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: theme.colors.glassBackground,
    borderColor: theme.colors.glassBorder,
    borderWidth: StyleSheet.hairlineWidth,
    alignItems: 'center',
    justifyContent: 'center',
  },
  menuIcon: {
    color: theme.colors.textPrimary,
    fontSize: 20,
  },
  fab: {
    position: 'absolute',
    alignSelf: 'center',
    width: theme.radii.fab * 2,
    height: theme.radii.fab * 2,
    borderRadius: theme.radii.fab,
    backgroundColor: theme.colors.fabBackground,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
