import { describe, expect, it } from "vitest";
import { canAfford, costFor, pointsAfterPurchase, pointsForSession, unlockCostLabel } from "./points.js";
import type { UnlockPoolItem } from "./unlock-pool.js";

describe("pointsForSession", () => {
  it("earns 10 points per minute", () => {
    expect(pointsForSession(10)).toBe(100);
    expect(pointsForSession(25)).toBe(250);
    expect(pointsForSession(50)).toBe(500);
  });
});

describe("costFor", () => {
  it("costs 150 points for a common item", () => {
    expect(costFor({ id: "c", name: "Common", rarity: "common" })).toBe(150);
  });

  it("costs 500 points for an uncommon item", () => {
    expect(costFor({ id: "u", name: "Uncommon", rarity: "uncommon" })).toBe(500);
  });

  it("costs 1500 points for a rare item", () => {
    expect(costFor({ id: "r", name: "Rare", rarity: "rare" })).toBe(1500);
  });
});

describe("canAfford", () => {
  const commonItem: UnlockPoolItem = { id: "c", name: "Common", rarity: "common" };

  it("is true when the balance meets the cost exactly", () => {
    expect(canAfford(150, commonItem)).toBe(true);
  });

  it("is true when the balance exceeds the cost", () => {
    expect(canAfford(1000, commonItem)).toBe(true);
  });

  it("is false when the balance is below the cost", () => {
    expect(canAfford(149, commonItem)).toBe(false);
  });
});

describe("pointsAfterPurchase", () => {
  it("subtracts the item's cost from the balance", () => {
    const rareItem: UnlockPoolItem = { id: "r", name: "Rare", rarity: "rare" };
    expect(pointsAfterPurchase(2000, rareItem)).toBe(500);
  });
});

describe("unlockCostLabel", () => {
  it("describes the point cost to unlock an item", () => {
    expect(unlockCostLabel({ id: "c", name: "Common", rarity: "common" })).toBe("150 pts to unlock");
  });
});
