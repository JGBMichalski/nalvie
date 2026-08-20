// Variant B ("full-bleed tank + glass overlay") design language, per
// .scratch/v1-roadmap/issues/03-visual-design-direction.md. Dark/immersive
// is the app's default look in both light and dark mode for now — a real
// light variant is deferred to the Settings spec's theme toggle.

export const theme = {
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
