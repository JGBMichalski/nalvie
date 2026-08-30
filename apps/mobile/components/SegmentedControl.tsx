import { useMemo } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { useTheme } from '../lib/ThemeProvider';

export interface SegmentedControlOption<T> {
  label: string;
  value: T;
}

// A segmented control is a horizontal set of buttons where only one can be selected at a time.
export function SegmentedControl<T extends string | number | boolean | null>({
  options,
  value,
  onChange,
}: {
  options: SegmentedControlOption<T>[];
  value: T;
  onChange: (value: T) => void;
}) {
  const theme = useTheme();
  const styles = useMemo(
    () =>
      StyleSheet.create({
        row: {
          flexDirection: 'row',
          gap: 8,
        },
        segment: {
          flex: 1,
          paddingVertical: 10,
          borderRadius: theme.radii.glass,
          backgroundColor: theme.colors.glassBackground,
          borderColor: theme.colors.glassBorder,
          borderWidth: StyleSheet.hairlineWidth,
          alignItems: 'center',
        },
        segmentSelected: {
          backgroundColor: theme.colors.fabBackground,
          borderColor: theme.colors.fabBackground,
        },
        label: {
          color: theme.colors.textPrimary,
          fontWeight: '600',
          fontSize: 13,
        },
        labelSelected: {
          color: theme.colors.fabIcon,
        },
      }),
    [theme],
  );

  return (
    <View style={styles.row}>
      {options.map((option) => {
        const selected = option.value === value;
        return (
          <Pressable
            key={option.label}
            style={[styles.segment, selected && styles.segmentSelected]}
            onPress={() => onChange(option.value)}
            accessibilityRole="button"
            accessibilityLabel={option.label}
            accessibilityState={{ selected }}
          >
            <Text style={[styles.label, selected && styles.labelSelected]}>{option.label}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}
