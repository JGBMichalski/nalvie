import { UNLOCK_POOL } from '@nalvie/core';

import { tankItemVisual } from '../../lib/tank-item-visuals';

describe('tankItemVisual', () => {
  it('has a visual for every item in the unlock pool', () => {
    for (const item of UNLOCK_POOL) {
      expect(tankItemVisual(item.id)).not.toBe('❔');
    }
  });

  it('falls back to a placeholder glyph for an unknown id', () => {
    expect(tankItemVisual('not-a-real-item')).toBe('❔');
  });
});
