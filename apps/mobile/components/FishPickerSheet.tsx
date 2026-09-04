import { useMemo } from 'react';
import { Alert, FlatList, Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { canAfford, unlockCostLabel, type UnlockPoolItem } from '@nalvie/core';

import { TankItemVisual } from './TankItemVisual';
import { useTheme } from '../lib/ThemeProvider';

const ITEM_VISUAL_SIZE = 48;

const RANDOM_TILE_ID = '__random__';

function pickRandomOwnedId(items: UnlockPoolItem[], ownedSpeciesIds: ReadonlySet<string>): string | undefined {
  const owned = items.filter((item) => ownedSpeciesIds.has(item.id));
  if (owned.length === 0) return undefined;
  return owned[Math.floor(Math.random() * owned.length)].id;
}

export function FishPickerSheet({
  visible,
  items,
  ownedSpeciesIds,
  pointsBalance,
  onClose,
  onSelect,
  onPurchase,
}: {
  visible: boolean;
  items: UnlockPoolItem[];
  // The permanent ownership ledger — the only thing that gates whether a
  // species can be chosen for a session. Cost/affordability only matters
  // for species not yet in this set.
  ownedSpeciesIds: ReadonlySet<string>;
  pointsBalance: number;
  onClose: () => void;
  onSelect: (itemId: string) => void;
  onPurchase: (itemId: string) => void;
}) {
  const theme = useTheme();
  const styles = useMemo(
    () =>
      StyleSheet.create({
        backdrop: {
          flex: 1,
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
        },
        sheet: {
          backgroundColor: theme.colors.tankBackgroundTo,
          borderTopLeftRadius: 24,
          borderTopRightRadius: 24,
          padding: 24,
          maxHeight: '70%',
          gap: 16,
        },
        title: {
          color: theme.colors.textPrimary,
          fontSize: 18,
          fontWeight: '600',
        },
        row: {
          gap: 12,
          marginBottom: 12,
        },
        item: {
          flex: 1,
          paddingVertical: 16,
          borderRadius: theme.radii.glass,
          backgroundColor: theme.colors.glassBackground,
          borderColor: theme.colors.glassBorder,
          borderWidth: StyleSheet.hairlineWidth,
          alignItems: 'center',
          gap: 6,
        },
        itemLocked: {
          opacity: 0.6,
        },
        stage: {
          height: ITEM_VISUAL_SIZE,
          justifyContent: 'center',
        },
        visualLocked: {
          opacity: 0.4,
        },
        lockBadge: {
          position: 'absolute',
          alignSelf: 'center',
        },
        lockIcon: {
          fontSize: 16,
        },
        itemName: {
          color: theme.colors.textPrimary,
          fontSize: 12,
          fontWeight: '600',
        },
        itemNameLocked: {
          color: theme.colors.textSecondary,
        },
        requirement: {
          color: theme.colors.textSecondary,
          fontSize: 10,
          textAlign: 'center',
        },
        randomIcon: {
          fontSize: ITEM_VISUAL_SIZE * 0.6,
          textAlign: 'center',
        },
      }),
    [theme],
  );

  const data = useMemo<Array<UnlockPoolItem | typeof RANDOM_TILE_ID>>(() => [...items, RANDOM_TILE_ID], [items]);

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose} testID="fish-picker-backdrop" />
      <SafeAreaView edges={['bottom']} style={styles.sheet}>
        <Text style={styles.title}>Choose a fish</Text>

        <FlatList
          data={data}
          keyExtractor={(item) => (item === RANDOM_TILE_ID ? RANDOM_TILE_ID : item.id)}
          numColumns={3}
          columnWrapperStyle={styles.row}
          showsVerticalScrollIndicator={false}
          renderItem={({ item }) => {
            if (item === RANDOM_TILE_ID) {
              const hasOwnedFish = items.some((poolItem) => ownedSpeciesIds.has(poolItem.id));

              function handleRandomPress() {
                const randomId = pickRandomOwnedId(items, ownedSpeciesIds);
                if (randomId) onSelect(randomId);
              }

              return (
                <Pressable
                  style={[styles.item, !hasOwnedFish && styles.itemLocked]}
                  onPress={handleRandomPress}
                  disabled={!hasOwnedFish}
                  testID="fish-item-random"
                  accessibilityState={{ disabled: !hasOwnedFish }}
                  accessibilityLabel="Random unlocked fish"
                >
                  <View style={styles.stage}>
                    <Text style={styles.randomIcon}>🎲</Text>
                  </View>
                  <Text style={styles.itemName}>Random</Text>
                </Pressable>
              );
            }

            const owned = ownedSpeciesIds.has(item.id);
            const affordable = owned || canAfford(pointsBalance, item);
            const locked = !owned && !affordable;
            const costLabel = owned ? '' : unlockCostLabel(item);
            const fishItem: UnlockPoolItem = item;

            function handlePress() {
              if (locked) return;
              if (owned) {
                onSelect(fishItem.id);
                return;
              }
              Alert.alert(`Buy ${fishItem.name} for ${costLabel.replace(' to unlock', '')}?`, undefined, [
                { text: 'Cancel', style: 'cancel' },
                { text: 'Buy', onPress: () => onPurchase(fishItem.id) },
              ]);
            }

            return (
              <Pressable
                style={[styles.item, locked && styles.itemLocked]}
                onPress={handlePress}
                disabled={locked}
                testID={`fish-item-${item.id}`}
                accessibilityState={{ disabled: locked }}
                accessibilityLabel={!owned ? `${item.name}. ${costLabel}.` : undefined}
              >
                <View style={styles.stage}>
                  <View style={locked && styles.visualLocked}>
                    <TankItemVisual itemId={item.id} size={ITEM_VISUAL_SIZE} />
                  </View>
                  {locked && (
                    <View style={styles.lockBadge}>
                      <Text style={styles.lockIcon}>🔒</Text>
                    </View>
                  )}
                </View>
                <Text style={[styles.itemName, locked && styles.itemNameLocked]}>{item.name}</Text>
                {!owned && <Text style={styles.requirement}>{costLabel}</Text>}
              </Pressable>
            );
          }}
        />
      </SafeAreaView>
    </Modal>
  );
}
