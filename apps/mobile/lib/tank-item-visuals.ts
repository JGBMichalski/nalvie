import type { ComponentType } from 'react';

import { Angelfish } from '../components/Angelfish';
import { Clownfish } from '../components/Clownfish';
import { Goldfish } from '../components/Goldfish';
import { Guppy } from '../components/Guppy';
import { Jellyfish } from '../components/Jellyfish';
import { NeonTetra } from '../components/NeonTetra';
import { SeaTurtle } from '../components/SeaTurtle';
import { Seahorse } from '../components/Seahorse';
import { Shrimp } from '../components/Shrimp';

const TANK_ITEM_ANIMATIONS: Record<string, ComponentType<{ size?: number }>> = {
  clownfish: Clownfish,
  guppy: Guppy,
  'neon-tetra': NeonTetra,
  goldfish: Goldfish,
  shrimp: Shrimp,
  angelfish: Angelfish,
  seahorse: Seahorse,
  jellyfish: Jellyfish,
  'sea-turtle': SeaTurtle,
};

export function tankItemAnimation(itemId: string): ComponentType<{ size?: number }> | undefined {
  return TANK_ITEM_ANIMATIONS[itemId];
}

// Radially symmetric creatures have no left or right, so turning them around
// would just squash them through zero width for no reason.
const NON_DIRECTIONAL_ITEMS = new Set(['jellyfish']);

export function tankItemFlipsToFaceTravel(itemId: string): boolean {
  return !NON_DIRECTIONAL_ITEMS.has(itemId);
}

// How an item occupies the tank: free-roaming swimmers vs. decor anchored to the floor.
export type TankItemBehaviour = 'swim' | 'seabed';

const SEABED_ITEMS = new Set([
  'seaweed',
  'pebbles',
  'snail',
  'starfish',
  'coral-branch',
  'sunken-chest',
  'anemone',
  'bubbler',
  'glowing-reef',
]);

export function tankItemBehaviour(itemId: string): TankItemBehaviour {
  return SEABED_ITEMS.has(itemId) ? 'seabed' : 'swim';
}

// Some creatures' artwork reads as oversized at the standard swimmer size.
const SIZE_SCALE: Partial<Record<string, number>> = {
  angelfish: 0.7,
  jellyfish: 0.65,
  seahorse: 0.6,
};

export function tankItemSizeScale(itemId: string): number {
  return SIZE_SCALE[itemId] ?? 1;
}

const TANK_ITEM_EMOJI: Record<string, string> = {
  clownfish: '🐠',
  guppy: '🐟',
  'neon-tetra': '🐟',
  goldfish: '🐡',
  starfish: '⭐',
  seaweed: '🌿',
  pebbles: '🪨',
  snail: '🐌',
  shrimp: '🦐',
  bubbler: '🫧',
  angelfish: '🐠',
  seahorse: '🌊',
  'coral-branch': '🪸',
  'sunken-chest': '🧰',
  jellyfish: '🎐',
  anemone: '🌸',
  'sea-turtle': '🐢',
  'glowing-reef': '✨',
};

export function tankItemVisual(itemId: string): string {
  return TANK_ITEM_EMOJI[itemId] ?? '❔';
}
