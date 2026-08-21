import type { Settings } from '@nalvie/core';

export const DEFAULT_SETTINGS: Settings = {
  defaultSessionMinutes: 25,
  soundEnabled: true,
  darkModeOverride: null, // follow system
  notificationsEnabled: false, // opt-in, not assumed
  hasCompletedOnboarding: false,
};
