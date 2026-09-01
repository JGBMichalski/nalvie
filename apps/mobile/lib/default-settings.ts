import type { Settings } from '@nalvie/core';
import { DEFAULT_TANK_THEME_ID } from '@nalvie/core';

import { DEFAULT_SOMAFM_STATION_ID } from './somafm-stations';

export const DEFAULT_SETTINGS: Settings = {
  defaultSessionMinutes: 25,
  soundEnabled: true,
  hasCompletedOnboarding: false,
  soundSource: 'local',
  somafmStationId: DEFAULT_SOMAFM_STATION_ID,
  pointsBalance: 0,
  tankThemeId: DEFAULT_TANK_THEME_ID,
};
