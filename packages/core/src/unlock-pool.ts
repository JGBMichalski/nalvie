import type { TankItem } from "./types.js";

export type Rarity = "common" | "uncommon" | "rare";

export interface UnlockPoolItem {
  id: string;
  name: string;
  rarity: Rarity;
}

// 18 items total per spec (10 common, 6 uncommon, 2 rare) — seabed/decor
// items are commented out for now, leaving 5 common, 3 uncommon, 1 rare.
export const UNLOCK_POOL: UnlockPoolItem[] = [
  { id: "clownfish", name: "Clownfish", rarity: "common" },
  { id: "guppy", name: "Guppy", rarity: "common" },
  { id: "neon-tetra", name: "Neon Tetra", rarity: "common" },
  { id: "goldfish", name: "Goldfish", rarity: "uncommon" },
  // { id: "starfish", name: "Starfish", rarity: "common" },
  // { id: "seaweed", name: "Seaweed", rarity: "common" },
  // { id: "pebbles", name: "Pebbles", rarity: "common" },
  // { id: "snail", name: "Snail", rarity: "common" },
  { id: "shrimp", name: "Shrimp", rarity: "uncommon" },
  // { id: "bubbler", name: "Bubbler", rarity: "common" },
  { id: "angelfish", name: "Angelfish", rarity: "uncommon" },
  { id: "seahorse", name: "Seahorse", rarity: "uncommon" },
  // { id: "coral-branch", name: "Coral Branch", rarity: "uncommon" },
  // { id: "sunken-chest", name: "Sunken Chest", rarity: "uncommon" },
  { id: "jellyfish", name: "Jellyfish", rarity: "rare" },
  // { id: "anemone", name: "Anemone", rarity: "uncommon" },
  { id: "sea-turtle", name: "Sea Turtle", rarity: "rare" },
  // { id: "glowing-reef", name: "Glowing Reef", rarity: "rare" },
];

// Species pre-owned from install, so there's always something to pick for
// session #1 even before any points have been earned/spent.
export const STARTER_SPECIES_IDS: readonly string[] = ["clownfish", "guppy"];

/**
 * Builds the `TankItem` record for a chosen unlocked item id. `instanceId`
 * must be unique per unlock, even for repeat instances of the same species.
 */
export function unlockPoolItemToTankItem(
  pool: UnlockPoolItem[],
  itemId: string,
  instanceId: string,
  unlockedAt: string,
): TankItem {
  const poolItem = pool.find((item) => item.id === itemId);
  return {
    id: instanceId,
    speciesId: itemId,
    name: poolItem?.name ?? itemId,
    rarity: poolItem?.rarity ?? "common",
    unlockedAt,
  };
}
