import type { SessionRepository } from '@nalvie/core';

import { createInMemorySessionRepository } from './in-memory-session-repository';

// A single shared repository instance for the whole app's lifetime, so
// screens outside the Home/Tank hierarchy (e.g. a dev menu action) write to
// the same store the session loop reads from. Still just the in-memory
// placeholder — swapping the factory below for a durable one is all that'll
// need to change later.
let backing: SessionRepository = createInMemorySessionRepository();

export const sessionRepository: SessionRepository = {
  saveSession: (session) => backing.saveSession(session),
  getSession: (id) => backing.getSession(id),
  listSessions: () => backing.listSessions(),
  getInProgressSession: () => backing.getInProgressSession(),
  saveTankItem: (item) => backing.saveTankItem(item),
  listTankItems: () => backing.listTankItems(),
};

/**
 * Test-only: swaps in a fresh in-memory store. Every test file that renders
 * a screen importing `sessionRepository` shares this one instance (jest only
 * isolates modules between test *files*, not between `it`s within one) — call
 * this in `beforeEach` to avoid leaking state between test cases.
 */
export function resetSessionRepositoryForTests(): void {
  backing = createInMemorySessionRepository();
}
