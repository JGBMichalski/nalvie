import { useEffect, useMemo, useState } from 'react';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Slider from '@react-native-community/slider';
import { MIN_SESSION_MINUTES, SESSION_PRESET_MINUTES } from '@nalvie/core';

import { useTheme } from '../lib/ThemeProvider';

const MAX_CUSTOM_MINUTES = 120;

export function DurationPickerSheet({
  visible,
  defaultMinutes = SESSION_PRESET_MINUTES[0],
  onClose,
  onStart,
}: {
  visible: boolean;
  defaultMinutes?: number;
  onClose: () => void;
  onStart: (minutes: number) => void;
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
          gap: 16,
        },
        title: {
          color: theme.colors.textPrimary,
          fontSize: 18,
          fontWeight: '600',
        },
        presets: {
          flexDirection: 'row',
          gap: 12,
        },
        preset: {
          flex: 1,
          paddingVertical: 12,
          borderRadius: theme.radii.glass,
          backgroundColor: theme.colors.glassBackground,
          borderColor: theme.colors.glassBorder,
          borderWidth: StyleSheet.hairlineWidth,
          alignItems: 'center',
        },
        presetSelected: {
          backgroundColor: theme.colors.fabBackground,
          borderColor: theme.colors.fabBackground,
        },
        presetText: {
          color: theme.colors.textPrimary,
          fontWeight: '600',
        },
        presetTextSelected: {
          color: theme.colors.fabIcon,
        },
        customLabel: {
          color: theme.colors.textSecondary,
          fontSize: 14,
        },
        startButton: {
          backgroundColor: theme.colors.fabBackground,
          borderRadius: theme.radii.glass,
          paddingVertical: 16,
          alignItems: 'center',
        },
        startButtonText: {
          color: theme.colors.fabIcon,
          fontWeight: '700',
          fontSize: 16,
        },
        devButton: {
          alignItems: 'center',
          paddingVertical: 8,
        },
        devButtonText: {
          color: theme.colors.textSecondary,
          fontSize: 12,
        },
      }),
    [theme],
  );
  const [minutes, setMinutes] = useState<number>(defaultMinutes);

  useEffect(() => {
    if (visible) setMinutes(defaultMinutes);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible]);

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose} testID="duration-picker-backdrop" />
      <SafeAreaView edges={['bottom']} style={styles.sheet}>
        <Text style={styles.title}>Start a session</Text>

        <View style={styles.presets}>
          {SESSION_PRESET_MINUTES.map((preset) => (
            <Pressable
              key={preset}
              style={[styles.preset, minutes === preset && styles.presetSelected]}
              onPress={() => setMinutes(preset)}
            >
              <Text style={[styles.presetText, minutes === preset && styles.presetTextSelected]}>
                {preset}m
              </Text>
            </Pressable>
          ))}
        </View>

        <Text style={styles.customLabel}>Custom: {minutes} min</Text>
        <Slider
          minimumValue={MIN_SESSION_MINUTES}
          maximumValue={MAX_CUSTOM_MINUTES}
          step={5}
          value={minutes}
          onValueChange={setMinutes}
          minimumTrackTintColor={theme.colors.fabBackground}
          accessibilityLabel="Custom session duration"
        />

        <Pressable style={styles.startButton} onPress={() => onStart(minutes)}>
          <Text style={styles.startButtonText}>Start</Text>
        </Pressable>

        {__DEV__ && (
          <Pressable style={styles.devButton} onPress={() => onStart(10 / 60)}>
            <Text style={styles.devButtonText}>10s (dev)</Text>
          </Pressable>
        )}
      </SafeAreaView>
    </Modal>
  );
}
