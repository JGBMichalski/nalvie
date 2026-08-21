import { renderRouter, screen } from 'expo-router/testing-library';
import { act, fireEvent } from '@testing-library/react-native';
import { UNLOCK_POOL } from '@nalvie/core';

import { resetSessionRepositoryForTests, sessionRepository } from '../lib/repository';

describe('dev "unlock all creatures" menu action', () => {
  beforeEach(() => {
    resetSessionRepositoryForTests();
  });

  it('unlocks every pool item and returns to a Home screen that reflects it', async () => {
    renderRouter('./app', { initialUrl: '/' });

    fireEvent.press(await screen.findByLabelText('Open menu'));
    fireEvent.press(await screen.findByText('Unlock all creatures (dev)'));
    await act(async () => {}); // flush the repository writes + router.back()

    expect(screen).toHavePathname('/');
    expect(await screen.findByText(new RegExp(`${UNLOCK_POOL.length} items`))).toBeTruthy();
    expect(await sessionRepository.listTankItems()).toHaveLength(UNLOCK_POOL.length);
  });
});
