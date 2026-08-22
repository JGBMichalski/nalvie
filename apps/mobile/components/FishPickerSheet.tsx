import { FlatList, Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { unlockRequirementLabel, type UnlockPoolItem } from '@nalvie/core';

import { TankItemVisual } from './TankItemVisual';
import { theme } from '../theme';

const ITEM_VISUAL_SIZE = 48;

export function FishPickerSheet({
  visible,
  items,
  eligibleItemIds,
  ownedSpeciesIds = new Set(),
  onClose,
  onSelect,
}: {
  visible: boolean;
  items: UnlockPoolItem[];
  eligibleItemIds: ReadonlySet<string>;
  // Ownership is the real source of truth for anything already earned — a
  // streak-gated item's eligibility can lapse (a missed day resets the
  // streak) even though the player already has one in their tank.
  ownedSpeciesIds?: ReadonlySet<string>;
  onClose: () => void;
  onSelect: (itemId: string) => void;
}) {
  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose} testID="fish-picker-backdrop" />
      <SafeAreaView edges={['bottom']} style={styles.sheet}>
        <Text style={styles.title}>Choose a fish</Text>

        <FlatList
          data={items}
          keyExtractor={(item) => item.id}
          numColumns={3}
          columnWrapperStyle={styles.row}
          showsVerticalScrollIndicator={false}
          renderItem={({ item }) => {
            const locked = !eligibleItemIds.has(item.id) && !ownedSpeciesIds.has(item.id);
            const requirement = locked ? unlockRequirementLabel(item) : '';
            return (
              <Pressable
                style={[styles.item, locked && styles.itemLocked]}
                onPress={() => !locked && onSelect(item.id)}
                disabled={locked}
                testID={`fish-item-${item.id}`}
                accessibilityState={{ disabled: locked }}
                accessibilityLabel={locked ? `${item.name}. ${requirement}.` : undefined}
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
                {locked && <Text style={styles.requirement}>{requirement}</Text>}
              </Pressable>
            );
          }}
        />
      </SafeAreaView>
    </Modal>
  );
}

const styles = StyleSheet.create({
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
});
