import { useMemo } from 'react';
import { FlatList, Modal, Pressable, StyleSheet, Text } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useTheme } from '../lib/ThemeProvider';

export interface PickerOption<T> {
  label: string;
  value: T;
}

// A bottom-sheet single-select list — the "combo box" for a value with too
// many options to comfortably fit a SegmentedControl (e.g. more than 3-4).
export function PickerSheet<T extends string | number>({
  visible,
  title,
  options,
  value,
  onSelect,
  onClose,
}: {
  visible: boolean;
  title: string;
  options: PickerOption<T>[];
  value: T;
  onSelect: (value: T) => void;
  onClose: () => void;
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
        option: {
          flexDirection: 'row',
          justifyContent: 'space-between',
          alignItems: 'center',
          paddingVertical: 14,
          paddingHorizontal: 16,
          borderRadius: theme.radii.glass,
          backgroundColor: theme.colors.glassBackground,
          borderColor: theme.colors.glassBorder,
          borderWidth: StyleSheet.hairlineWidth,
          marginBottom: 10,
        },
        optionSelected: {
          borderColor: theme.colors.fabBackground,
        },
        optionText: {
          color: theme.colors.textPrimary,
          fontSize: 15,
          fontWeight: '600',
        },
        optionTextSelected: {
          color: theme.colors.fabBackground,
        },
        check: {
          color: theme.colors.fabBackground,
          fontWeight: '700',
        },
      }),
    [theme],
  );

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose} testID="picker-sheet-backdrop" />
      <SafeAreaView edges={['bottom']} style={styles.sheet}>
        <Text style={styles.title}>{title}</Text>

        <FlatList
          data={options}
          keyExtractor={(option) => String(option.value)}
          showsVerticalScrollIndicator={false}
          renderItem={({ item }) => {
            const selected = item.value === value;
            return (
              <Pressable
                style={[styles.option, selected && styles.optionSelected]}
                onPress={() => {
                  onSelect(item.value);
                  onClose();
                }}
                accessibilityRole="button"
                accessibilityLabel={item.label}
                accessibilityState={{ selected }}
              >
                <Text style={[styles.optionText, selected && styles.optionTextSelected]}>{item.label}</Text>
                {selected && <Text style={styles.check}>✓</Text>}
              </Pressable>
            );
          }}
        />
      </SafeAreaView>
    </Modal>
  );
}
