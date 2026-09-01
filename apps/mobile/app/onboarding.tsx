import { useCallback, useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { TANK_THEMES, type TankItem } from '@nalvie/core';

import { GlassPanel } from '../components/GlassPanel';
import { TankBackdrop } from '../components/TankBackdrop';
import { TankScene } from '../components/TankScene';
import { completeOnboarding } from '../lib/onboarding';
import { useTheme, useThemeContext } from '../lib/ThemeProvider';

interface Slide {
  headline: string;
  body: string;
  tankItems: TankItem[];
  themePicker?: boolean;
}

// Placeholder unlockedAt timestamp for the onboarding preview items.
const UNLOCKED_AT = '2024-01-01T00:00:00.000Z';

function previewItem(id: string, speciesId: string): TankItem {
  return { id, speciesId, name: speciesId, rarity: 'common', unlockedAt: UNLOCKED_AT };
}

// Multi-screen first-launch intro. Reuses the real tank scene/swim
// simulation rather than commissioning separate onboarding-only
// illustrations — a sparse tank for screen 1, a fuller/livelier
// one for later screens. The final screen lets the user pick their
// tank theme, previewing it live against the real backdrop.
const SLIDES: Slide[] = [
  {
    headline: 'Grow a living tank',
    body: 'Every focus session adds something new to your tank.',
    tankItems: [previewItem('onboarding-guppy', 'guppy')],
  },
  {
    headline: 'Earn points, unlock fish',
    body: 'Sessions earn points based on how long you focus. Spend them to unlock new fish for your tank.',
    tankItems: [
      previewItem('onboarding-clownfish-points', 'clownfish'),
      previewItem('onboarding-goldfish', 'goldfish'),
    ],
  },
  {
    headline: 'Leave and lose it',
    body: "Leave early and that session's reward is lost — but your tank is always safe.",
    tankItems: [
      previewItem('onboarding-clownfish', 'clownfish'),
      previewItem('onboarding-angelfish', 'angelfish'),
      previewItem('onboarding-neon-tetra', 'neon-tetra'),
      previewItem('onboarding-jellyfish', 'jellyfish'),
      previewItem('onboarding-seahorse', 'seahorse'),
    ],
  },
  {
    headline: 'Pick your tank',
    body: 'Choose a look for your tank. You can change it any time in Settings.',
    themePicker: true,
    tankItems: [
      previewItem('onboarding-theme-sea-turtle', 'sea-turtle'),
      previewItem('onboarding-theme-shrimp', 'shrimp'),
    ],
  },
];

export default function OnboardingScreen() {
  const theme = useTheme();
  const { tankThemeId, setTankThemeId } = useThemeContext();
  const [step, setStep] = useState(0);
  const isLastSlide = step === SLIDES.length - 1;
  const slide = SLIDES[step];

  const complete = useCallback(async () => {
    await completeOnboarding();
    router.replace('/');
  }, []);

  const styles = useMemo(
    () =>
      StyleSheet.create({
        container: {
          flex: 1,
          padding: 20,
          justifyContent: 'space-between',
        },
        skip: {
          alignSelf: 'flex-end',
        },
        skipText: {
          color: theme.colors.textSecondary,
          fontSize: 15,
        },
        content: {
          flex: 1,
          justifyContent: 'center',
          gap: 20,
        },
        stage: {
          height: 220,
        },
        panel: {
          gap: 8,
        },
        themePicker: {
          marginTop: 4,
          gap: 8,
        },
        themeOption: {
          flexDirection: 'row',
          alignItems: 'center',
          gap: 12,
          paddingVertical: 10,
          paddingHorizontal: 12,
          borderRadius: theme.radii.glass,
          borderWidth: StyleSheet.hairlineWidth,
          borderColor: theme.colors.glassBorder,
        },
        themeOptionSelected: {
          backgroundColor: theme.colors.fabBackground,
          borderColor: theme.colors.fabBackground,
        },
        themeSwatch: {
          width: 18,
          height: 18,
          borderRadius: 9,
        },
        themeOptionLabel: {
          color: theme.colors.textPrimary,
          fontSize: 15,
          fontWeight: '600',
        },
        themeOptionLabelSelected: {
          color: theme.colors.fabIcon,
        },
        headline: {
          color: theme.colors.textPrimary,
          fontSize: 24,
          fontWeight: '700',
        },
        body: {
          color: theme.colors.textSecondary,
          fontSize: 15,
        },
        primaryButton: {
          alignSelf: 'stretch',
          backgroundColor: theme.colors.fabBackground,
          borderRadius: theme.radii.glass,
          paddingVertical: 16,
          alignItems: 'center',
        },
        primaryButtonText: {
          color: theme.colors.fabIcon,
          fontSize: 16,
          fontWeight: '600',
        },
      }),
    [theme],
  );

  return (
    <TankBackdrop>
      <SafeAreaView edges={['top', 'bottom']} style={styles.container}>
        {!isLastSlide && (
          <Pressable style={styles.skip} onPress={complete} hitSlop={8}>
            <Text style={styles.skipText}>Skip</Text>
          </Pressable>
        )}

        <View style={styles.content}>
          <View style={styles.stage}>
            <TankScene items={slide.tankItems} />
          </View>
          <GlassPanel style={styles.panel}>
            <Text style={styles.headline}>{slide.headline}</Text>
            <Text style={styles.body}>{slide.body}</Text>
            {slide.themePicker && (
              <View style={styles.themePicker}>
                {TANK_THEMES.map((tankTheme) => {
                  const selected = tankTheme.id === tankThemeId;
                  return (
                    <Pressable
                      key={tankTheme.id}
                      style={[styles.themeOption, selected && styles.themeOptionSelected]}
                      onPress={() => setTankThemeId(tankTheme.id)}
                      accessibilityRole="button"
                      accessibilityLabel={tankTheme.name}
                      accessibilityState={{ selected }}
                    >
                      <View style={[styles.themeSwatch, { backgroundColor: tankTheme.palette.accent }]} />
                      <Text style={[styles.themeOptionLabel, selected && styles.themeOptionLabelSelected]}>
                        {tankTheme.name}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
            )}
          </GlassPanel>
        </View>

        <Pressable
          style={styles.primaryButton}
          onPress={isLastSlide ? complete : () => setStep((current) => current + 1)}
        >
          <Text style={styles.primaryButtonText}>{isLastSlide ? 'Get started' : 'Next'}</Text>
        </Pressable>
      </SafeAreaView>
    </TankBackdrop>
  );
}
