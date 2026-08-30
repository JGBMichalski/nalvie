export const darkTheme = {
  colors: {
    tankBackgroundFrom: '#112233',
    tankBackgroundTo: '#001018',
    glassBackground: 'rgba(255, 255, 255, 0.08)',
    glassBorder: 'rgba(255, 255, 255, 0.15)',
    glassText: '#ddffff',
    fabBackground: '#1fd1a7',
    fabIcon: '#00251c',
    textPrimary: '#ffffff',
    textSecondary: 'rgba(255, 255, 255, 0.7)',
  },
  radii: {
    glass: 16,
    fab: 38,
  },
} as const;

export const lightTheme = {
  colors: {
    tankBackgroundFrom: '#bfe9f5',
    tankBackgroundTo: '#5fb4d4',
    glassBackground: 'rgba(255, 255, 255, 0.45)',
    glassBorder: 'rgba(0, 40, 60, 0.15)',
    glassText: '#05303f',
    fabBackground: '#0f9e7f',
    fabIcon: '#ffffff',
    textPrimary: '#05303f',
    textSecondary: 'rgba(5, 48, 63, 0.65)',
  },
  radii: {
    glass: 16,
    fab: 38,
  },
} as const;

export type Theme = {
  colors: { [K in keyof typeof darkTheme.colors]: string };
  radii: typeof darkTheme.radii;
};

export type ColorScheme = 'light' | 'dark';

// Resolves the tri-state override (null = follow system) against the current
// system scheme into a concrete palette.
export function resolveColorScheme(
  darkModeOverride: boolean | null,
  systemScheme: ColorScheme,
): ColorScheme {
  if (darkModeOverride === null) return systemScheme;
  return darkModeOverride ? 'dark' : 'light';
}

export function themeForScheme(scheme: ColorScheme): Theme {
  return scheme === 'light' ? lightTheme : darkTheme;
}

// Back-compat default
export const theme = darkTheme;
