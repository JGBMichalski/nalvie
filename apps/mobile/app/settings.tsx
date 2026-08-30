import { useCallback, useEffect, useMemo, useState } from 'react';
import { Pressable, StyleSheet, Switch, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { SESSION_PRESET_MINUTES, type Settings } from '@nalvie/core';

import { GlassPanel } from '../components/GlassPanel';
import { BackButton } from '../components/BackButton';
import { PickerSheet } from '../components/PickerSheet';
import { SegmentedControl } from '../components/SegmentedControl';
import { SelectField } from '../components/SelectField';
import { TankBackdrop } from '../components/TankBackdrop';
import { useAmbientSound } from '../hooks/useAmbientSound';
import { DEFAULT_SETTINGS } from '../lib/default-settings';
import { settingsRepository } from '../lib/repository';
import { SOMAFM_STATIONS, somafmStationName } from '../lib/somafm-stations';
import { useTheme, useThemeContext } from '../lib/ThemeProvider';

const DARK_MODE_OPTIONS: { label: string; value: boolean | null }[] = [
  { label: 'System', value: null },
  { label: 'Light', value: false },
  { label: 'Dark', value: true },
];

const SOUND_SOURCE_OPTIONS: { label: string; value: Settings['soundSource'] }[] = [
  { label: 'Local', value: 'local' },
  { label: 'SomaFM', value: 'somafm' },
];

const SOMAFM_STATION_OPTIONS = SOMAFM_STATIONS.map((station) => ({ label: station.name, value: station.id }));

export default function SettingsScreen() {
  const theme = useTheme();
  const { darkModeOverride, setDarkModeOverride } = useThemeContext();
  const [settings, setSettings] = useState<Settings>(DEFAULT_SETTINGS);
  const [stationPickerOpen, setStationPickerOpen] = useState(false);
  const [previewPlaying, setPreviewPlaying] = useState(false);

  const styles = useMemo(
    () =>
      StyleSheet.create({
        container: {
          flex: 1,
          padding: 20,
          gap: 16,
        },
        title: {
          color: theme.colors.textPrimary,
          fontSize: 22,
          fontWeight: '600',
        },
        headerRow: {
          flexDirection: 'row',
          alignItems: 'center',
          gap: 12,
        },
        row: {
          gap: 10,
        },
        toggleRow: {
          flexDirection: 'row',
          justifyContent: 'space-between',
          alignItems: 'center',
        },
        label: {
          color: theme.colors.textSecondary,
          fontSize: 14,
        },
        stationControls: {
          flexDirection: 'row',
          alignItems: 'center',
          gap: 8,
        },
        previewButton: {
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
        previewButtonText: {
          color: theme.colors.textPrimary,
          fontWeight: '600',
          fontSize: 13,
        },
      }),
    [theme],
  );

  // Lets a user preview a station before committing to it for a session
  useAmbientSound(previewPlaying, { type: 'somafm', stationId: settings.somafmStationId });
  useEffect(() => {
    if (!settings.soundEnabled || settings.soundSource !== 'somafm') {
      setPreviewPlaying(false);
    }
  }, [settings.soundEnabled, settings.soundSource]);

  useEffect(() => {
    settingsRepository.getSettings().then(setSettings);
  }, []);

  const save = useCallback((next: Settings) => {
    setSettings(next);
    settingsRepository.saveSettings(next);
  }, []);

  return (
    <TankBackdrop>
      <SafeAreaView edges={['top', 'bottom']} style={styles.container}>
        <View style={styles.headerRow}>
          <BackButton />
          <Text style={styles.title}>Settings</Text>
        </View>

        <GlassPanel style={styles.row}>
          <Text style={styles.label}>Default session length</Text>
          <SegmentedControl
            options={SESSION_PRESET_MINUTES.map((minutes) => ({ label: `${minutes}m`, value: minutes }))}
            value={settings.defaultSessionMinutes}
            onChange={(defaultSessionMinutes) => save({ ...settings, defaultSessionMinutes })}
          />
        </GlassPanel>

        <GlassPanel style={[styles.row, styles.toggleRow]}>
          <Text style={styles.label}>Sound</Text>
          <Switch
            value={settings.soundEnabled}
            onValueChange={(soundEnabled) => save({ ...settings, soundEnabled })}
            accessibilityLabel="Sound"
          />
        </GlassPanel>

        {settings.soundEnabled && (
          <GlassPanel style={styles.row}>
            <Text style={styles.label}>Sound source</Text>
            <SegmentedControl
              options={SOUND_SOURCE_OPTIONS}
              value={settings.soundSource}
              onChange={(soundSource) => save({ ...settings, soundSource })}
            />
          </GlassPanel>
        )}

        {settings.soundEnabled && settings.soundSource === 'somafm' && (
          <GlassPanel style={[styles.row, styles.toggleRow]}>
            <Text style={styles.label}>SomaFM station</Text>
            <View style={styles.stationControls}>
              <SelectField
                value={somafmStationName(settings.somafmStationId)}
                accessibilityLabel="SomaFM station"
                onPress={() => setStationPickerOpen(true)}
              />
              <Pressable
                style={styles.previewButton}
                onPress={() => setPreviewPlaying((playing) => !playing)}
                accessibilityLabel="Preview station"
              >
                <Ionicons
                  name={previewPlaying ? 'stop' : 'play'}
                  size={16}
                  color={theme.colors.textPrimary}
                />
                <Text style={styles.previewButtonText}>{previewPlaying ? 'Stop preview' : 'Preview'}</Text>
              </Pressable>
            </View>
          </GlassPanel>
        )}

        <GlassPanel style={styles.row}>
          <Text style={styles.label}>Theme</Text>
          <SegmentedControl
            options={DARK_MODE_OPTIONS}
            value={darkModeOverride}
            onChange={(nextOverride) => {
              setDarkModeOverride(nextOverride);
              setSettings((current) => ({ ...current, darkModeOverride: nextOverride }));
            }}
          />
        </GlassPanel>
      </SafeAreaView>

      <PickerSheet
        visible={stationPickerOpen}
        title="SomaFM station"
        options={SOMAFM_STATION_OPTIONS}
        value={settings.somafmStationId}
        onSelect={(somafmStationId) => save({ ...settings, somafmStationId })}
        onClose={() => setStationPickerOpen(false)}
      />
    </TankBackdrop>
  );
}
