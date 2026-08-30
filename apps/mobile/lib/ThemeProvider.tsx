import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { useColorScheme } from 'react-native';

import { DEFAULT_SETTINGS } from './default-settings';
import { settingsRepository } from './repository';
import { resolveColorScheme, themeForScheme, darkTheme, type ColorScheme, type Theme } from '../theme';

interface ThemeContextValue {
  theme: Theme;
  colorScheme: ColorScheme;
  darkModeOverride: boolean | null;
  setDarkModeOverride: (override: boolean | null) => void;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [darkModeOverride, setDarkModeOverrideState] = useState<boolean | null>(
    DEFAULT_SETTINGS.darkModeOverride,
  );

  const systemScheme: ColorScheme = useColorScheme() === 'light' ? 'light' : 'dark';

  useEffect(() => {
    settingsRepository.getSettings().then((settings) => {
      setDarkModeOverrideState(settings.darkModeOverride);
    });
  }, []);

  const setDarkModeOverride = useCallback((override: boolean | null) => {
    setDarkModeOverrideState(override);
    settingsRepository.getSettings().then((settings) => {
      settingsRepository.saveSettings({ ...settings, darkModeOverride: override });
    });
  }, []);

  const colorScheme = resolveColorScheme(darkModeOverride, systemScheme);

  const value = useMemo<ThemeContextValue>(
    () => ({
      theme: themeForScheme(colorScheme),
      colorScheme,
      darkModeOverride,
      setDarkModeOverride,
    }),
    [colorScheme, darkModeOverride, setDarkModeOverride],
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useThemeContext(): ThemeContextValue {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useThemeContext must be used within a ThemeProvider');
  }
  return context;
}

export function useTheme(): Theme {
  return useContext(ThemeContext)?.theme ?? darkTheme;
}
