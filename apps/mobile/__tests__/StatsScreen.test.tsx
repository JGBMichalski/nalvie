import { act } from '@testing-library/react-native';
import { renderRouter, screen } from 'expo-router/testing-library';
import type { FocusSession } from '@nalvie/core';

import { resetSessionRepositoryForTests, sessionRepository } from '../lib/repository';

function completedSession(startedAt: string, plannedDurationMinutes: number, id: string): FocusSession {
  return {
    id,
    plannedDurationMinutes,
    startedAt,
    endedAt: startedAt,
    outcome: 'completed',
    selectedItemId: 'clownfish',
    awardedItemId: 'clownfish',
    pausedMs: 0,
  };
}

function failedSession(startedAt: string, id: string): FocusSession {
  return {
    id,
    plannedDurationMinutes: 25,
    startedAt,
    endedAt: startedAt,
    outcome: 'failed',
    selectedItemId: 'clownfish',
    awardedItemId: null,
    pausedMs: 0,
  };
}

describe('<StatsScreen />', () => {
  beforeEach(() => {
    resetSessionRepositoryForTests();
  });

  it('shows the empty state when no session has ever completed', async () => {
    renderRouter('./app', { initialUrl: '/stats' });
    await act(async () => {});

    expect(await screen.findByText('Complete a session to start your streak')).toBeTruthy();
    expect(screen.getByText('0m')).toBeTruthy();
  });

  it('summarizes total focus time, streaks, and completed/failed counts', async () => {
    const today = new Date().toISOString();
    await sessionRepository.saveSession(completedSession(today, 25, 'session-1'));
    await sessionRepository.saveSession(completedSession(today, 10, 'session-2'));
    await sessionRepository.saveSession(failedSession(today, 'session-3'));

    renderRouter('./app', { initialUrl: '/stats' });
    await act(async () => {});

    expect(await screen.findByText('35m')).toBeTruthy();
    expect(screen.getAllByText('1 day')).toHaveLength(2); // current + longest streak
    expect(screen.getByText('2 / 1')).toBeTruthy(); // completed / failed
    expect(screen.queryByText('Complete a session to start your streak')).toBeNull();
  });

  it('flags the streak as at risk when nothing has completed yet today', async () => {
    const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
    await sessionRepository.saveSession(completedSession(yesterday, 25, 'session-1'));

    renderRouter('./app', { initialUrl: '/stats' });
    await act(async () => {});

    expect(await screen.findByText(/at risk today/)).toBeTruthy();
  });

  it('renders the 84-day heatmap grid', async () => {
    renderRouter('./app', { initialUrl: '/stats' });
    await act(async () => {});

    expect(await screen.findByTestId('stats-heatmap')).toBeTruthy();
  });

  it('shows the number of items currently in the tank', async () => {
    await sessionRepository.saveTankItem({
      id: 'instance-1',
      speciesId: 'clownfish',
      name: 'Clownfish',
      rarity: 'common',
      unlockedAt: new Date().toISOString(),
    });
    await sessionRepository.saveTankItem({
      id: 'instance-2',
      speciesId: 'guppy',
      name: 'Guppy',
      rarity: 'common',
      unlockedAt: new Date().toISOString(),
    });

    renderRouter('./app', { initialUrl: '/stats' });
    await act(async () => {});

    expect(await screen.findByText('Items in tank')).toBeTruthy();
    expect(screen.getByText('2')).toBeTruthy();
  });
});
