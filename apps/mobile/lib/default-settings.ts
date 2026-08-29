import type { Settings } from '@nalvie/core';

import { DEFAULT_SOMAFM_STATION_ID } from './somafm-stations';

export const DEFAULT_SETTINGS: Settings = {
  defaultSessionMinutes: 25,
  soundEnabled: true,
  darkModeOverride: null, // follow system
  hasCompletedOnboarding: false,
  soundSource: 'local',
  somafmStationId: DEFAULT_SOMAFM_STATION_ID,
};
