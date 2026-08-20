import { FlatList, Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import type { UnlockPoolItem } from '@nalvie/core';

import { TankItemVisual } from './TankItemVisual';
import { theme } from '../theme';

const ITEM_VISUAL_SIZE = 48;

export function FishPickerSheet({
  visible,
  items,
  onClose,
  onSelect,
}: {
  visible: boolean;
  items: UnlockPoolItem[];
  onClose: () => void;
  onSelect: (itemId: string) => void;
}) {
  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose} testID="fish-picker-backdrop" />
      <View style={styles.sheet}>
        <Text style={styles.title}>Choose a fish</Text>

        <FlatList
          data={items}
          keyExtractor={(item) => item.id}
          numColumns={3}
          columnWrapperStyle={styles.row}
          renderItem={({ item }) => (
            <Pressable style={styles.item} onPress={() => onSelect(item.id)}>
              <View style={styles.stage}>
                <TankItemVisual itemId={item.id} size={ITEM_VISUAL_SIZE} />
              </View>
              <Text style={styles.itemName}>{item.name}</Text>
            </Pressable>
          )}
        />
      </View>
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
  stage: {
    height: ITEM_VISUAL_SIZE,
    justifyContent: 'center',
  },
  itemName: {
    color: theme.colors.textPrimary,
    fontSize: 12,
    fontWeight: '600',
  },
});
