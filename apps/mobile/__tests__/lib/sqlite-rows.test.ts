import type { FocusSession, Settings, TankItem } from '@nalvie/core';

import {
  rowToSession,
  rowToSettings,
  rowToTankItem,
  sessionToRow,
  settingsToRow,
  tankItemToRow,
  SETTINGS_ROW_ID,
} from '../../lib/sqlite-rows';

describe('session row mapping', () => {
  const session: FocusSession = {
    id: 's1',
    plannedDurationMinutes: 25,
    startedAt: '2026-01-01T00:00:00.000Z',
    endedAt: '2026-01-01T00:25:00.000Z',
    outcome: 'completed',
    selectedItemId: 'clownfish',
    awardedItemId: 'clownfish',
    pausedMs: 1000,
  };

  it('round-trips a completed session through row form', () => {
    expect(rowToSession(sessionToRow(session))).toEqual(session);
  });

  it('round-trips an in-progress session (nulls preserved)', () => {
    const inProgress: FocusSession = { ...session, endedAt: null, outcome: null, awardedItemId: null };
    expect(rowToSession(sessionToRow(inProgress))).toEqual(inProgress);
  });
});

describe('tank item row mapping', () => {
  const item: TankItem = {
    id: 'instance-1',
    speciesId: 'clownfish',
    name: 'Clownfish',
    rarity: 'common',
    unlockedAt: '2026-01-01T00:00:00.000Z',
  };

  it('round-trips a tank item through row form', () => {
    expect(rowToTankItem(tankItemToRow(item))).toEqual(item);
  });
});

describe('settings row mapping', () => {
  const settings: Settings = {
    defaultSessionMinutes: 25,
    soundEnabled: true,
    darkModeOverride: null,
    notificationsEnabled: false,
  };

  it('round-trips settings, always keyed to the fixed row id', () => {
    const row = settingsToRow(settings);
    expect(row.id).toBe(SETTINGS_ROW_ID);
    expect(rowToSettings(row)).toEqual(settings);
  });

  it('round-trips darkModeOverride: true and false distinctly from null', () => {
    expect(rowToSettings(settingsToRow({ ...settings, darkModeOverride: true })).darkModeOverride).toBe(true);
    expect(rowToSettings(settingsToRow({ ...settings, darkModeOverride: false })).darkModeOverride).toBe(false);
    expect(rowToSettings(settingsToRow({ ...settings, darkModeOverride: null })).darkModeOverride).toBeNull();
  });
});
