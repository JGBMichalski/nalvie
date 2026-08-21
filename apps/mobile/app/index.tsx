import { useCallback, useEffect, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Link, router, useFocusEffect } from 'expo-router';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

import { DurationPickerSheet } from '../components/DurationPickerSheet';
import { FishPickerSheet } from '../components/FishPickerSheet';
import { GlassPanel } from '../components/GlassPanel';
import { PlayIcon } from '../components/PlayIcon';
import { TankBackdrop } from '../components/TankBackdrop';
import { TankScene } from '../components/TankScene';
import { useSessionLoop } from '../hooks/useSessionLoop';
import { sessionRepository, settingsRepository } from '../lib/repository';
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
  const [onboardingGateResolved, setOnboardingGateResolved] = useState(false);
  const {
    phase,
    session,
    remainingMs,
    isPaused,
    hasUsedPause,
    unlockedItems,
    eligibleItems,
    streak,
    toastMessage,
    startSession,
    togglePause,
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
  // menu action) whenever this screen comes back into focus.
  useFocusEffect(
    useCallback(() => {
      refresh();
    }, [refresh]),
  );

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

        <Link href="/menu" asChild>
          <Pressable
            style={StyleSheet.flatten([styles.menuButton, { top: insets.top + 20 }])}
            hitSlop={8}
            accessibilityLabel="Open menu"
          >
            <Text style={styles.menuIcon}>☰</Text>
          </Pressable>
        </Link>

        {phase === 'in-progress' && session && (
          <View style={StyleSheet.flatten([styles.sessionChrome, { bottom: insets.bottom + 28 }])}>
            <GlassPanel style={styles.timerPanel}>
              <Text style={styles.timerText}>{formatRemaining(remainingMs)}</Text>
            </GlassPanel>
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
            <PlayIcon size={30} color={theme.colors.fabIcon} />
          </Pressable>
        )}
      </SafeAreaView>

      <FishPickerSheet
        visible={step === 'fish'}
        items={eligibleItems}
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
