// Placeholder for the TankItemId -> Lottie file mapping.
// No animation assets exist in this repo yet, so tank items render as emoji until real
// Lottie files land. Swapping this out shouldn't require touching callers.
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
