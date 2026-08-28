import { useCallback, useEffect, useState } from 'react';
import { StyleSheet, Switch, Text, View } from 'react-native';
import { useFocusEffect } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { SESSION_PRESET_MINUTES, type Settings } from '@nalvie/core';

import { GlassPanel } from '../components/GlassPanel';
import { BackButton } from '../components/BackButton';
import { PickerSheet } from '../components/PickerSheet';
import { SegmentedControl } from '../components/SegmentedControl';
import { SelectField } from '../components/SelectField';
import { TankBackdrop } from '../components/TankBackdrop';
import { DEFAULT_SETTINGS } from '../lib/default-settings';
import { hasNotificationPermission, resolveNotificationsEnabled } from '../lib/notification-permissions';
import { settingsRepository } from '../lib/repository';
import { SOMAFM_STATIONS, somafmStationName } from '../lib/somafm-stations';
import { theme } from '../theme';

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
  const [settings, setSettings] = useState<Settings>(DEFAULT_SETTINGS);
  const [notificationsGranted, setNotificationsGranted] = useState(false);
  const [stationPickerOpen, setStationPickerOpen] = useState(false);

  useEffect(() => {
    settingsRepository.getSettings().then(setSettings);
  }, []);

  // Re-checked on every focus — the user can revoke (or, via the
  // deep-link-to-system-settings path below, grant) notification
  // permission from outside the app
  useFocusEffect(
    useCallback(() => {
      hasNotificationPermission().then(setNotificationsGranted);
    }, []),
  );

  const save = useCallback((next: Settings) => {
    setSettings(next);
    settingsRepository.saveSettings(next);
  }, []);

  const onToggleNotifications = useCallback(
    async (wantsEnabled: boolean) => {
      const notificationsEnabled = await resolveNotificationsEnabled(wantsEnabled);
      setNotificationsGranted(notificationsEnabled);
      save({ ...settings, notificationsEnabled });
    },
    [save, settings],
  );

  // Get the notification state from the setting config and the OS.
  const notificationsOn = settings.notificationsEnabled && notificationsGranted;

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
            <SelectField
              value={somafmStationName(settings.somafmStationId)}
              accessibilityLabel="SomaFM station"
              onPress={() => setStationPickerOpen(true)}
            />
          </GlassPanel>
        )}

        <GlassPanel style={styles.row}>
          <Text style={styles.label}>Dark mode</Text>
          {/* Only dark mode exists today. Need to build light mode. */}
          <SegmentedControl
            options={DARK_MODE_OPTIONS}
            value={settings.darkModeOverride}
            onChange={(darkModeOverride) => save({ ...settings, darkModeOverride })}
          />
        </GlassPanel>

        <GlassPanel style={[styles.row, styles.toggleRow]}>
          <Text style={styles.label}>Notifications</Text>
          <Switch value={notificationsOn} onValueChange={onToggleNotifications} accessibilityLabel="Notifications" />
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

const styles = StyleSheet.create({
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
});
