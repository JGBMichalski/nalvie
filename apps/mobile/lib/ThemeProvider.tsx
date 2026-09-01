import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { DEFAULT_TANK_THEME_ID, tankThemeById } from '@nalvie/core';

import { settingsRepository } from './repository';
import { darkTheme, type Theme } from '../theme';

interface ThemeContextValue {
  theme: Theme;
  tankThemeId: string;
  setTankThemeId: (id: string) => void;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [tankThemeId, setTankThemeIdState] = useState<string>(DEFAULT_TANK_THEME_ID);

  useEffect(() => {
    settingsRepository.getSettings().then((settings) => {
      setTankThemeIdState(settings.tankThemeId);
    });
  }, []);

  const setTankThemeId = useCallback((id: string) => {
    setTankThemeIdState(id);
    settingsRepository.getSettings().then((settings) => {
      settingsRepository.saveSettings({ ...settings, tankThemeId: id });
    });
  }, []);

  const value = useMemo<ThemeContextValue>(() => {
    const palette = tankThemeById(tankThemeId).palette;
    const theme: Theme = {
      ...darkTheme,
      colors: {
        ...darkTheme.colors,
        fabBackground: palette.accent,
        fabIcon: palette.accentForeground,
        glassBackground: palette.glassBackground,
        glassBorder: palette.glassBorder,
      },
    };
    return { theme, tankThemeId, setTankThemeId };
  }, [tankThemeId, setTankThemeId]);

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

export function useTankThemeId(): string {
  return useContext(ThemeContext)?.tankThemeId ?? DEFAULT_TANK_THEME_ID;
}
