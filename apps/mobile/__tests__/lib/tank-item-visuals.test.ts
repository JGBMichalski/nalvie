import { UNLOCK_POOL } from '@nalvie/core';

import { tankItemBehaviour, tankItemFlipsToFaceTravel, tankItemSizeScale, tankItemVisual } from '../../lib/tank-item-visuals';

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

describe('tankItemBehaviour', () => {
  it('treats fish as swimmers', () => {
    expect(tankItemBehaviour('clownfish')).toBe('swim');
    expect(tankItemBehaviour('sea-turtle')).toBe('swim');
  });

  it('anchors decor to the seabed', () => {
    expect(tankItemBehaviour('seaweed')).toBe('seabed');
    expect(tankItemBehaviour('sunken-chest')).toBe('seabed');
  });
});

describe('tankItemSizeScale', () => {
  it('shrinks creatures whose artwork reads oversized at the standard size', () => {
    expect(tankItemSizeScale('angelfish')).toBeLessThan(1);
    expect(tankItemSizeScale('jellyfish')).toBeLessThan(1);
    expect(tankItemSizeScale('seahorse')).toBeLessThan(1);
  });

  it('leaves other items at the standard size', () => {
    expect(tankItemSizeScale('clownfish')).toBe(1);
  });
});

describe('tankItemFlipsToFaceTravel', () => {
  it('turns directional creatures to face where they are going', () => {
    expect(tankItemFlipsToFaceTravel('clownfish')).toBe(true);
    expect(tankItemFlipsToFaceTravel('seahorse')).toBe(true);
  });

  it('leaves radially symmetric creatures unflipped', () => {
    expect(tankItemFlipsToFaceTravel('jellyfish')).toBe(false);
  });
});
