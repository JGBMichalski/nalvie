import { Pressable, StyleSheet, Text } from 'react-native';

import { theme } from '../theme';

// The trigger for a PickerSheet — shows the current value and a chevron,
// tap to open the sheet. Presentational only; the caller owns open state.
export function SelectField({
  value,
  accessibilityLabel,
  onPress,
}: {
  value: string;
  accessibilityLabel: string;
  onPress: () => void;
}) {
  return (
    <Pressable
      style={styles.field}
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
    >
      <Text style={styles.value}>{value}</Text>
      <Text style={styles.chevron}>⌄</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  field: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: theme.radii.glass,
    backgroundColor: theme.colors.glassBackground,
    borderColor: theme.colors.glassBorder,
    borderWidth: StyleSheet.hairlineWidth,
  },
  value: {
    color: theme.colors.textPrimary,
    fontWeight: '600',
    fontSize: 13,
  },
  chevron: {
    color: theme.colors.textSecondary,
    fontSize: 13,
  },
});
