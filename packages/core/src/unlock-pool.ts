import type { StreakInfo, TankItem } from "./types.js";

export type Rarity = "common" | "uncommon" | "rare";

export interface UnlockPoolItem {
  id: string;
  name: string;
  rarity: Rarity;
  eligibility: "always" | { minCompletedSessions: number } | { minStreakDays: number };
}

// 18 items total per spec (10 common, 6 uncommon, 2 rare) — seabed/decor
// items are commented out for now, leaving 5 common, 3 uncommon, 1 rare.
export const UNLOCK_POOL: UnlockPoolItem[] = [
  { id: "clownfish", name: "Clownfish", rarity: "common", eligibility: "always" },
  { id: "guppy", name: "Guppy", rarity: "common", eligibility: "always" },
  { id: "neon-tetra", name: "Neon Tetra", rarity: "common", eligibility: "always" },
  { id: "goldfish", name: "Goldfish", rarity: "common", eligibility: "always" },
  // { id: "starfish", name: "Starfish", rarity: "common", eligibility: "always" },
  // { id: "seaweed", name: "Seaweed", rarity: "common", eligibility: "always" },
  // { id: "pebbles", name: "Pebbles", rarity: "common", eligibility: "always" },
  // { id: "snail", name: "Snail", rarity: "common", eligibility: "always" },
  { id: "shrimp", name: "Shrimp", rarity: "common", eligibility: "always" },
  // { id: "bubbler", name: "Bubbler", rarity: "common", eligibility: "always" },
  { id: "angelfish", name: "Angelfish", rarity: "uncommon", eligibility: { minCompletedSessions: 5 } },
  { id: "seahorse", name: "Seahorse", rarity: "uncommon", eligibility: { minCompletedSessions: 5 } },
  // { id: "coral-branch", name: "Coral Branch", rarity: "uncommon", eligibility: { minCompletedSessions: 5 } },
  // { id: "sunken-chest", name: "Sunken Chest", rarity: "uncommon", eligibility: { minCompletedSessions: 5 } },
  { id: "jellyfish", name: "Jellyfish", rarity: "uncommon", eligibility: { minCompletedSessions: 5 } },
  // { id: "anemone", name: "Anemone", rarity: "uncommon", eligibility: { minCompletedSessions: 5 } },
  { id: "sea-turtle", name: "Sea Turtle", rarity: "rare", eligibility: { minStreakDays: 7 } },
  // { id: "glowing-reef", name: "Glowing Reef", rarity: "rare", eligibility: { minStreakDays: 7 } },
];

const RARITY_ODDS: Record<Rarity, number> = {
  common: 0.7,
  uncommon: 0.25,
  rare: 0.05,
};

function isEligible(item: UnlockPoolItem, stats: { completedSessions: number; streak: StreakInfo }): boolean {
  if (item.eligibility === "always") return true;
  if ("minCompletedSessions" in item.eligibility) {
    return stats.completedSessions >= item.eligibility.minCompletedSessions;
  }
  return stats.streak.current >= item.eligibility.minStreakDays;
}

/**
 * What the fish picker should offer, regardless of what's already unlocked.
 */
export function eligiblePoolItems(
  pool: UnlockPoolItem[],
  stats: { completedSessions: number; streak: StreakInfo },
): UnlockPoolItem[] {
  return pool.filter((item) => isEligible(item, stats));
}

function pickWeighted(weights: Partial<Record<Rarity, number>>, random: () => number): Rarity {
  const entries = Object.entries(weights) as [Rarity, number][];
  const total = entries.reduce((sum, [, weight]) => sum + weight, 0);
  let roll = random() * total;
  for (const [rarity, weight] of entries) {
    if (roll < weight) return rarity;
    roll -= weight;
  }
  return entries[entries.length - 1][0];
}

function pickOne(items: UnlockPoolItem[], random: () => number): string {
  const index = Math.min(items.length - 1, Math.floor(random() * items.length));
  return items[index].id;
}

/**
 * Builds the `TankItem` record for a reward id returned by `pickReward`.
 * `instanceId` must be unique per unlock, even for repeat instances of the
 * same species.
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
