import { useCallback, useEffect, useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Link, router, useFocusEffect } from 'expo-router';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { UNLOCK_POOL } from '@nalvie/core';

import { DurationPickerSheet } from '../components/DurationPickerSheet';
import { FishPickerSheet } from '../components/FishPickerSheet';
import { GlassPanel } from '../components/GlassPanel';
import { MenuPopover } from '../components/MenuPopover';
import { PickerSheet } from '../components/PickerSheet';
import { TankBackdrop } from '../components/TankBackdrop';
import { TankScene } from '../components/TankScene';
import { useAmbientSound, toAmbientSource, type AmbientSource } from '../hooks/useAmbientSound';
import { useSessionLoop } from '../hooks/useSessionLoop';
import { sessionRepository, settingsRepository } from '../lib/repository';
import { SOMAFM_STATIONS, somafmStationName } from '../lib/somafm-stations';
import { theme } from '../theme';

function formatRemaining(ms: number): string {
  const totalSeconds = Math.max(0, Math.ceil(ms / 1000));
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${String(seconds).padStart(2, '0')}`;
}

// Home/Tank: the app's default screen
export default function HomeScreen() {
  const insets = useSafeAreaInsets();
  const [step, setStep] = useState<'idle' | 'fish' | 'duration'>('idle');
  const [selectedItemId, setSelectedItemId] = useState<string | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [onboardingGateResolved, setOnboardingGateResolved] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(false);
  const [ambientSource, setAmbientSource] = useState<AmbientSource>({ type: 'local' });
  const [sessionStationPickerOpen, setSessionStationPickerOpen] = useState(false);
  const {
    phase,
    session,
    remainingMs,
    isPaused,
    isSessionMuted,
    hasUsedPause,
    unlockedItems,
    eligibleItems,
    streak,
    toastMessage,
    startSession,
    togglePause,
    toggleSessionMute,
    refresh,
  } = useSessionLoop(sessionRepository);

  // Redirect to the intro before this screen ever renders its content.
  useEffect(() => {
    settingsRepository.getSettings().then((settings) => {
      if (settings.hasCompletedOnboarding) {
        setOnboardingGateResolved(true);
      } else {
        router.replace('/onboarding');
      }
    });
  }, []);

  // Picks up changes made elsewhere (e.g. the dev "unlock all creatures"
  // menu action, or a Settings change) whenever this screen comes back into focus.
  useFocusEffect(
    useCallback(() => {
      refresh();
      settingsRepository.getSettings().then((settings) => {
        setSoundEnabled(settings.soundEnabled);
        setAmbientSource(toAmbientSource(settings));
      });
    }, [refresh]),
  );

  // Ambience plays only while actively focusing (not paused or session-muted)
  // Resets to the start of the loop once the session actually resolves.
  const ambienceShouldPlay = phase === 'in-progress' && !isPaused && !isSessionMuted && soundEnabled;
  // Only recomputes when remainingSeconds ticks over
  const remainingSeconds = Math.ceil(remainingMs / 1000);
  const lockScreenMetadata = useMemo(
    () => ({
      title: isPaused ? 'Paused' : `${formatRemaining(remainingMs)} remaining`,
      artist: 'Nalvie focus session',
    }),
    // eslint-disable-next-line react-hooks/exhaustive-deps -- deliberately
    // keyed on remainingSeconds, not remainingMs, to enforce the once/second cadence
    [remainingSeconds, isPaused],
  );
  useAmbientSound(ambienceShouldPlay, ambientSource, phase !== 'in-progress', {
    metadata: lockScreenMetadata,
    sessionActive: phase === 'in-progress',
  });

  const changeStation = useCallback(async (stationId: string) => {
    const current = await settingsRepository.getSettings();
    await settingsRepository.saveSettings({ ...current, somafmStationId: stationId });
    setAmbientSource({ type: 'somafm', stationId });
    setSessionStationPickerOpen(false);
  }, []);

  const pauseLabel = isPaused ? 'Resume' : hasUsedPause ? 'Pause used' : 'Pause';

  if (!onboardingGateResolved) {
    return <TankBackdrop>{null}</TankBackdrop>;
  }

  return (
    <TankBackdrop>
      <SafeAreaView style={styles.overlay} edges={['top', 'bottom']}>
        <GlassPanel style={styles.streak}>
          <Text style={styles.glassText}>
            🔥 {streak.current}-day streak · {unlockedItems.length} items
          </Text>
        </GlassPanel>

        <TankScene items={unlockedItems} />

        {__DEV__ && (
          <Pressable
            style={StyleSheet.flatten([styles.menuButton, { top: insets.top + 20 }])}
            hitSlop={8}
            accessibilityLabel="Open menu"
            onPress={() => setMenuOpen(true)}
          >
            <Text style={styles.menuIcon}>☰</Text>
          </Pressable>
        )}

        {phase === 'in-progress' && session && (
          <View style={StyleSheet.flatten([styles.sessionChrome, { bottom: insets.bottom + 28 }])}>
            <GlassPanel style={styles.timerPanel}>
              <Text style={styles.timerText}>{formatRemaining(remainingMs)}</Text>
            </GlassPanel>
            <View style={styles.sessionButtons}>
              <Pressable onPress={togglePause} disabled={hasUsedPause && !isPaused}>
                <GlassPanel
                  style={StyleSheet.flatten([
                    styles.pausePanel,
                    hasUsedPause && !isPaused && styles.pausePanelDisabled,
                  ])}
                >
                  <Text style={styles.pauseText}>{pauseLabel}</Text>
                </GlassPanel>
              </Pressable>
              {soundEnabled && (
                <Pressable onPress={toggleSessionMute} accessibilityLabel="Toggle ambient sound">
                  <GlassPanel style={styles.pausePanel}>
                    <Text style={styles.pauseText}>{isSessionMuted ? 'Unmute' : 'Mute'}</Text>
                  </GlassPanel>
                </Pressable>
              )}
            </View>
            {ambienceShouldPlay && ambientSource.type === 'somafm' && (
              <Pressable
                onPress={() => setSessionStationPickerOpen(true)}
                accessibilityLabel="Change station"
                style={styles.stationAttribution}
              >
                <Text style={styles.attributionText}>SomaFM — {somafmStationName(ambientSource.stationId)}</Text>
                <Ionicons name="chevron-down" size={14} color={theme.colors.textSecondary} />
              </Pressable>
            )}
          </View>
        )}

        {(phase === 'toast-complete' || phase === 'toast-failed') && toastMessage && (
          <GlassPanel style={StyleSheet.flatten([styles.toast, { bottom: insets.bottom + 28 }])}>
            <Text style={styles.toastText}>{toastMessage}</Text>
          </GlassPanel>
        )}

        {phase === 'idle' && (
          <Pressable
            style={StyleSheet.flatten([styles.fab, { bottom: insets.bottom + 28 }])}
            accessibilityLabel="Start a session"
            onPress={() => setStep('fish')}
          >
            <Ionicons name="play" size={30} color={theme.colors.fabIcon} style={styles.playIcon} />
          </Pressable>
        )}

        {phase === 'idle' && (
          <Link href="/stats" asChild>
            <Pressable
              style={StyleSheet.flatten([styles.sideButton, styles.sideButtonLeft, { bottom: insets.bottom + 40 }])}
              accessibilityLabel="Stats"
            >
              <Ionicons name="stats-chart" size={22} color={theme.colors.textPrimary} />
            </Pressable>
          </Link>
        )}

        {phase === 'idle' && (
          <Link href="/settings" asChild>
            <Pressable
              style={StyleSheet.flatten([styles.sideButton, styles.sideButtonRight, { bottom: insets.bottom + 40 }])}
              accessibilityLabel="Settings"
            >
              <Ionicons name="settings-sharp" size={22} color={theme.colors.textPrimary} />
            </Pressable>
          </Link>
        )}
      </SafeAreaView>

      <FishPickerSheet
        visible={step === 'fish'}
        items={UNLOCK_POOL}
        eligibleItemIds={new Set(eligibleItems.map((item) => item.id))}
        ownedSpeciesIds={new Set(unlockedItems.map((item) => item.speciesId))}
        onClose={() => setStep('idle')}
        onSelect={(itemId) => {
          setSelectedItemId(itemId);
          setStep('duration');
        }}
      />

      <DurationPickerSheet
        visible={step === 'duration'}
        onClose={() => setStep('idle')}
        onStart={(minutes) => {
          setStep('idle');
          if (selectedItemId) startSession(minutes, selectedItemId);
        }}
      />
      {__DEV__ && (
        <MenuPopover
          visible={menuOpen}
          topOffset={insets.top + 20}
          onClose={() => setMenuOpen(false)}
          onDataChanged={refresh}
        />
      )}

      {ambientSource.type === 'somafm' && (
        <PickerSheet
          visible={sessionStationPickerOpen}
          title="SomaFM station"
          options={SOMAFM_STATIONS.map((station) => ({ label: station.name, value: station.id }))}
          value={ambientSource.stationId}
          onSelect={changeStation}
          onClose={() => setSessionStationPickerOpen(false)}
        />
      )}
    </TankBackdrop>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    padding: 20,
  },
  streak: {
    alignSelf: 'flex-start',
  },
  glassText: {
    color: theme.colors.glassText,
    fontSize: 13,
  },
  menuButton: {
    position: 'absolute',
    right: 20,
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: theme.colors.glassBackground,
    borderColor: theme.colors.glassBorder,
    borderWidth: StyleSheet.hairlineWidth,
    alignItems: 'center',
    justifyContent: 'center',
  },
  menuIcon: {
    color: theme.colors.textPrimary,
    fontSize: 20,
  },
  fab: {
    position: 'absolute',
    alignSelf: 'center',
    width: theme.radii.fab * 2,
    height: theme.radii.fab * 2,
    borderRadius: theme.radii.fab,
    backgroundColor: theme.colors.fabBackground,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sideButton: {
    position: 'absolute',
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: theme.colors.glassBackground,
    borderColor: theme.colors.glassBorder,
    borderWidth: StyleSheet.hairlineWidth,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sideButtonLeft: {
    left: 32,
  },
  sideButtonRight: {
    right: 32,
  },
  playIcon: {
    marginLeft: 3, // optical centering — the glyph's visual weight leans left
  },
  sessionChrome: {
    position: 'absolute',
    alignSelf: 'center',
    alignItems: 'center',
    gap: 12,
  },
  timerPanel: {
    alignItems: 'center',
  },
  timerText: {
    color: theme.colors.textPrimary,
    fontSize: 32,
    fontWeight: '200',
  },
  sessionButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  pausePanel: {
    alignItems: 'center',
  },
  pausePanelDisabled: {
    opacity: 0.5,
  },
  pauseText: {
    color: theme.colors.textPrimary,
    fontWeight: '600',
  },
  attributionText: {
    color: theme.colors.textSecondary,
    fontSize: 11,
  },
  stationAttribution: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  toast: {
    position: 'absolute',
    alignSelf: 'center',
    maxWidth: '80%',
  },
  toastText: {
    color: theme.colors.textPrimary,
    textAlign: 'center',
  },
});
