import { render, screen } from '@testing-library/react-native';
import { UNLOCK_POOL } from '@nalvie/core';

import TankPreviewScreen from '../app/tank-preview';
import { tankItemAnimation, tankItemVisual } from '../lib/tank-item-visuals';

const animated = UNLOCK_POOL.filter((item) => tankItemAnimation(item.id));
const emojiOnly = UNLOCK_POOL.filter((item) => !tankItemAnimation(item.id));

describe('TankPreviewScreen', () => {
  it('renders every unlockable item', async () => {
    await render(<TankPreviewScreen />);

    for (const item of UNLOCK_POOL) {
      expect(screen.getByText(item.name)).toBeTruthy();
    }
  });

  it('renders an animated creature for every item that has one', async () => {
    await render(<TankPreviewScreen />);

    expect(animated.length).toBeGreaterThan(0);
    for (const item of animated) {
      // Each animation labels itself with the pool's own name for the item.
      expect(screen.getByLabelText(item.name)).toBeTruthy();
    }
  });

  it('still falls back to emoji for items without an animation', async () => {
    await render(<TankPreviewScreen />);

    for (const item of emojiOnly) {
      expect(screen.getAllByText(tankItemVisual(item.id)).length).toBeGreaterThan(0);
    }
  });
});
