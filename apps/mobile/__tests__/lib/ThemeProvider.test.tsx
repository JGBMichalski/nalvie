import { act, fireEvent, render, screen } from '@testing-library/react-native';
import { Text, View } from 'react-native';

import { ThemeProvider, useTheme, useThemeContext } from '../../lib/ThemeProvider';
import { resetSettingsRepositoryForTests, settingsRepository } from '../../lib/repository';
import { darkTheme, lightTheme } from '../../theme';

// A tiny harness: shows the active glass background and buttons to flip the
// theme override through the provider, exercising the live-recolor path the
// Settings toggle uses.
function Harness() {
  const theme = useTheme();
  const { setDarkModeOverride } = useThemeContext();
  return (
    <View>
      <Text testID="bg">{theme.colors.glassBackground}</Text>
      <Text accessibilityRole="button" accessibilityLabel="go-dark" onPress={() => setDarkModeOverride(true)}>
        dark
      </Text>
      <Text accessibilityRole="button" accessibilityLabel="go-light" onPress={() => setDarkModeOverride(false)}>
        light
      </Text>
    </View>
  );
}

describe('ThemeProvider', () => {
  beforeEach(() => {
    resetSettingsRepositoryForTests();
  });

  it('recolors live when the override changes, and persists it', async () => {
    await render(
      <ThemeProvider>
        <Harness />
      </ThemeProvider>,
    );
    await act(async () => {});

    fireEvent.press(screen.getByLabelText('go-dark'));
    await act(async () => {});
    expect(screen.getByTestId('bg').props.children).toBe(darkTheme.colors.glassBackground);
    expect((await settingsRepository.getSettings()).darkModeOverride).toBe(true);

    fireEvent.press(screen.getByLabelText('go-light'));
    await act(async () => {});
    expect(screen.getByTestId('bg').props.children).toBe(lightTheme.colors.glassBackground);
    expect((await settingsRepository.getSettings()).darkModeOverride).toBe(false);
  });

  it('picks up a persisted override on mount', async () => {
    const current = await settingsRepository.getSettings();
    await settingsRepository.saveSettings({ ...current, darkModeOverride: true });

    await render(
      <ThemeProvider>
        <Harness />
      </ThemeProvider>,
    );
    await act(async () => {});

    expect(screen.getByTestId('bg').props.children).toBe(darkTheme.colors.glassBackground);
  });
});
