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

export type Theme = {
  colors: { [K in keyof typeof darkTheme.colors]: string };
  radii: typeof darkTheme.radii;
};

// The app uses a single dark chrome palette; the selected tank theme drives the
// accent color on top of it (see ThemeProvider).
export const theme = darkTheme;
