import { createInMemorySessionRepository } from '../../lib/in-memory-session-repository';

describe('createInMemorySessionRepository', () => {
  it('round-trips a saved session', async () => {
    const repo = createInMemorySessionRepository();
    const session = {
      id: 's1',
      plannedDurationMinutes: 25,
      startedAt: new Date().toISOString(),
      endedAt: null,
      outcome: null,
      selectedItemId: 'clownfish',
      awardedItemId: null,
      pausedMs: 0,
    };

    await repo.saveSession(session);

    expect(await repo.getSession('s1')).toEqual(session);
    expect(await repo.listSessions()).toEqual([session]);
  });

  it('finds the in-progress session (outcome still null)', async () => {
    const repo = createInMemorySessionRepository();
    const done = {
      id: 'done',
      plannedDurationMinutes: 10,
      startedAt: new Date().toISOString(),
      endedAt: new Date().toISOString(),
      outcome: 'completed' as const,
      selectedItemId: 'clownfish',
      awardedItemId: 'clownfish',
      pausedMs: 0,
    };
    const inProgress = { ...done, id: 'wip', endedAt: null, outcome: null, awardedItemId: null };

    await repo.saveSession(done);
    await repo.saveSession(inProgress);

    expect(await repo.getInProgressSession()).toEqual(inProgress);
  });

  it('returns null when nothing is in progress', async () => {
    const repo = createInMemorySessionRepository();
    expect(await repo.getInProgressSession()).toBeNull();
  });

  it('round-trips tank items', async () => {
    const repo = createInMemorySessionRepository();
    const item = {
      id: 'instance-1',
      speciesId: 'clownfish',
      name: 'Clownfish',
      rarity: 'common' as const,
      unlockedAt: new Date().toISOString(),
    };

    await repo.saveTankItem(item);

    expect(await repo.listTankItems()).toEqual([item]);
  });
});
