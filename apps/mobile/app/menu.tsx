import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Link, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { UNLOCK_POOL, unlockPoolItemToTankItem } from '@nalvie/core';

import { GlassPanel } from '../components/GlassPanel';
import { sessionRepository } from '../lib/session-repository';
import { theme } from '../theme';

export default function MenuScreen() {
  const router = useRouter();

  async function unlockAllCreatures() {
    const unlockedAt = new Date().toISOString();
    await Promise.all(
      UNLOCK_POOL.map((item) =>
        sessionRepository.saveTankItem(unlockPoolItemToTankItem(UNLOCK_POOL, item.id, unlockedAt)),
      ),
    );
    router.back();
  }

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
        {__DEV__ && (
          <>
            <Link href="/tank-preview" asChild>
              <Pressable>
                <GlassPanel style={styles.item}>
                  <Text style={styles.itemText}>Tank preview (dev)</Text>
                </GlassPanel>
              </Pressable>
            </Link>
            <Pressable onPress={unlockAllCreatures}>
              <GlassPanel style={styles.item}>
                <Text style={styles.itemText}>Unlock all creatures (dev)</Text>
              </GlassPanel>
            </Pressable>
          </>
        )}
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
