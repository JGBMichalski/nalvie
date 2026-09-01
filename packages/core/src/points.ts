import type { Rarity, UnlockPoolItem } from "./unlock-pool.js";

export const POINTS_PER_MINUTE = 10;

export function pointsForSession(plannedDurationMinutes: number): number {
  return plannedDurationMinutes * POINTS_PER_MINUTE;
}

export const RARITY_COSTS: Record<Rarity, number> = {
  common: 150,
  uncommon: 500,
  rare: 1500,
};

export function costFor(item: UnlockPoolItem): number {
  return RARITY_COSTS[item.rarity];
}

export function canAfford(pointsBalance: number, item: UnlockPoolItem): boolean {
  return pointsBalance >= costFor(item);
}

/** Assumes the caller already checked `canAfford` — does not guard here. */
export function pointsAfterPurchase(pointsBalance: number, item: UnlockPoolItem): number {
  return pointsBalance - costFor(item);
}

export function unlockCostLabel(item: UnlockPoolItem): string {
  return `${costFor(item)} pts to unlock`;
}
