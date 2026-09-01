import { useMemo } from 'react';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { Link, router } from 'expo-router';
import { UNLOCK_POOL, unlockPoolItemToTankItem } from '@nalvie/core';

import { GlassPanel } from './GlassPanel';
import { clearAllData, sessionRepository, settingsRepository } from '../lib/repository';
import { useTheme } from '../lib/ThemeProvider';

// A small dropdown anchored under the hamburger button. 
export function MenuPopover({
  visible,
  topOffset,
  onClose,
  onDataChanged,
}: {
  visible: boolean;
  topOffset: number;
  onClose: () => void;
  onDataChanged?: () => void;
}) {
  const theme = useTheme();
  const styles = useMemo(
    () =>
      StyleSheet.create({
        backdrop: {
          flex: 1,
        },
        popover: {
          position: 'absolute',
          right: 20,
          width: 220,
        },
        panel: {
          padding: 8,
          gap: 4,
        },
        item: {
          paddingVertical: 10,
          paddingHorizontal: 8,
        },
        itemText: {
          color: theme.colors.textPrimary,
          fontSize: 15,
          fontWeight: '600',
        },
      }),
    [theme],
  );

  async function unlockAllCreatures() {
    const unlockedAt = new Date().toISOString();
    await Promise.all(
      UNLOCK_POOL.map((item) =>
        Promise.all([
          sessionRepository.saveTankItem(unlockPoolItemToTankItem(UNLOCK_POOL, item.id, item.id, unlockedAt)),
          sessionRepository.saveUnlockedSpecies({ speciesId: item.id, unlockedAt }),
        ]),
      ),
    );
    onClose();
    onDataChanged?.();
  }

  async function addPoints() {
    const settings = await settingsRepository.getSettings();
    await settingsRepository.saveSettings({ ...settings, pointsBalance: settings.pointsBalance + 100 });
    onClose();
    onDataChanged?.();
  }

  // Wipes sessions/tank items/settings back to a fresh-install state, then
  // routes to onboarding.
  function clearDatabase() {
    clearAllData();
    onClose();
    router.replace('/onboarding');
  }

  if (!__DEV__) return null;

  return (
    <Modal visible={visible} animationType="fade" transparent onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose} testID="menu-popover-backdrop" />
      <View style={[styles.popover, { top: topOffset }]}>
        <GlassPanel style={styles.panel}>
          <Link href="/tank-preview" asChild>
            <Pressable style={styles.item} onPress={onClose}>
              <Text style={styles.itemText}>Tank preview (dev)</Text>
            </Pressable>
          </Link>
          <Pressable style={styles.item} onPress={unlockAllCreatures}>
            <Text style={styles.itemText}>Unlock all creatures (dev)</Text>
          </Pressable>
          <Pressable style={styles.item} onPress={addPoints}>
            <Text style={styles.itemText}>Add 100 points (dev)</Text>
          </Pressable>
          <Pressable style={styles.item} onPress={clearDatabase}>
            <Text style={styles.itemText}>Clear database (dev)</Text>
          </Pressable>
        </GlassPanel>
      </View>
    </Modal>
  );
}
