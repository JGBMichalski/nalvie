import { act, fireEvent, render, screen } from '@testing-library/react-native';
import { Text, View } from 'react-native';
import { tankThemeById } from '@nalvie/core';

import { ThemeProvider, useTheme, useThemeContext } from '../../lib/ThemeProvider';
import { resetSettingsRepositoryForTests, settingsRepository } from '../../lib/repository';

// A tiny harness: shows the active accent color and a button to switch the tank
// theme through the provider, exercising the live-recolor path the Settings
// tank-theme picker uses.
function Harness() {
  const theme = useTheme();
  const { setTankThemeId } = useThemeContext();
  return (
    <View>
      <Text testID="accent">{theme.colors.fabBackground}</Text>
      <Text testID="glass">{theme.colors.glassBackground}</Text>
      <Text
        accessibilityRole="button"
        accessibilityLabel="go-twilight"
        onPress={() => setTankThemeId('twilight')}
      >
        twilight
      </Text>
      <Text
        accessibilityRole="button"
        accessibilityLabel="go-tropical"
        onPress={() => setTankThemeId('tropical')}
      >
        tropical
      </Text>
    </View>
  );
}

describe('ThemeProvider', () => {
  beforeEach(() => {
    resetSettingsRepositoryForTests();
  });

  it('recolors the accent live when the tank theme changes, and persists it', async () => {
    await render(
      <ThemeProvider>
        <Harness />
      </ThemeProvider>,
    );
    await act(async () => {});

    fireEvent.press(screen.getByLabelText('go-twilight'));
    await act(async () => {});

    expect(screen.getByTestId('accent').props.children).toBe(tankThemeById('twilight').palette.accent);
    expect((await settingsRepository.getSettings()).tankThemeId).toBe('twilight');
  });

  it('picks up a persisted tank theme on mount', async () => {
    const current = await settingsRepository.getSettings();
    await settingsRepository.saveSettings({ ...current, tankThemeId: 'abyss' });

    await render(
      <ThemeProvider>
        <Harness />
      </ThemeProvider>,
    );
    await act(async () => {});

    expect(screen.getByTestId('accent').props.children).toBe(tankThemeById('abyss').palette.accent);
  });

  it('switches the glass tint between dark-water and bright-water themes', async () => {
    await render(
      <ThemeProvider>
        <Harness />
      </ThemeProvider>,
    );
    await act(async () => {});

    // Reef (default) is a dark-water theme: light glass tint.
    expect(screen.getByTestId('glass').props.children).toBe(tankThemeById('reef').palette.glassBackground);

    fireEvent.press(screen.getByLabelText('go-tropical'));
    await act(async () => {});

    // Tropical is a bright-water theme: dark glass tint, for text contrast.
    expect(screen.getByTestId('glass').props.children).toBe(tankThemeById('tropical').palette.glassBackground);
    expect(screen.getByTestId('glass').props.children).not.toBe(tankThemeById('reef').palette.glassBackground);
  });
});