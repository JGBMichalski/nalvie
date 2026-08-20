import { render, screen } from '@testing-library/react-native';
import type { ComponentType } from 'react';

import { Angelfish } from '../../components/Angelfish';
import { Clownfish } from '../../components/Clownfish';
import { Goldfish } from '../../components/Goldfish';
import { Guppy } from '../../components/Guppy';
import { Jellyfish } from '../../components/Jellyfish';
import { NeonTetra } from '../../components/NeonTetra';
import { SeaTurtle } from '../../components/SeaTurtle';
import { Seahorse } from '../../components/Seahorse';
import { Shrimp } from '../../components/Shrimp';

// Label must match the creature's name in core's UNLOCK_POOL
const CREATURES: [string, ComponentType<{ size?: number }>][] = [
  ['Clownfish', Clownfish],
  ['Guppy', Guppy],
  ['Neon Tetra', NeonTetra],
  ['Goldfish', Goldfish],
  ['Shrimp', Shrimp],
  ['Angelfish', Angelfish],
  ['Seahorse', Seahorse],
  ['Jellyfish', Jellyfish],
  ['Sea Turtle', SeaTurtle],
];

describe.each(CREATURES)('%s', (label, Creature) => {
  it('renders an animated creature', async () => {
    await render(<Creature />);

    expect(screen.getByLabelText(label)).toBeTruthy();
  });

  it('scales to the requested size', async () => {
    await render(<Creature size={40} />);

    expect(screen.getByLabelText(label)).toBeTruthy();
  });
});
