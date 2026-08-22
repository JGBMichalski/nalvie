import { describe, expect, it } from "vitest";
import { UNLOCK_POOL, eligiblePoolItems, unlockPoolItemToTankItem, unlockRequirementLabel } from "./unlock-pool.js";

function stats(overrides: Partial<{ completedSessions: number; streak: { current: number; longest: number } }> = {}) {
  return {
    completedSessions: 1,
    streak: { current: 0, longest: 0 },
    ...overrides,
  };
}

describe("UNLOCK_POOL", () => {
  it("currently has 9 active items (3 common / 4 uncommon / 2 rare) — seabed items are commented out", () => {
    expect(UNLOCK_POOL).toHaveLength(9);
    expect(UNLOCK_POOL.filter((i) => i.rarity === "common")).toHaveLength(3);
    expect(UNLOCK_POOL.filter((i) => i.rarity === "uncommon")).toHaveLength(4);
    expect(UNLOCK_POOL.filter((i) => i.rarity === "rare")).toHaveLength(2);
  });

  it("has unique ids", () => {
    const ids = UNLOCK_POOL.map((i) => i.id);
    expect(new Set(ids).size).toBe(ids.length);
  });
});

describe("eligiblePoolItems", () => {
  const commonPool = [{ id: "c1", name: "Common 1", rarity: "common" as const, eligibility: "always" as const }];
  const uncommonPool = [
    { id: "u1", name: "Uncommon 1", rarity: "uncommon" as const, eligibility: { minCompletedSessions: 5 } },
  ];
  const rarePool = [{ id: "r1", name: "Rare 1", rarity: "rare" as const, eligibility: { minStreakDays: 7 } }];
  const fullPool = [...commonPool, ...uncommonPool, ...rarePool];

  it("includes only always-eligible items before any gate opens", () => {
    const items = eligiblePoolItems(fullPool, stats({ completedSessions: 0 }));
    expect(items.map((i) => i.id)).toEqual(["c1"]);
  });

  it("includes uncommon items once the session-count gate is met", () => {
    const items = eligiblePoolItems(fullPool, stats({ completedSessions: 5 }));
    expect(items.map((i) => i.id)).toEqual(["c1", "u1"]);
  });

  it("includes rare items once the streak gate is met", () => {
    const items = eligiblePoolItems(fullPool, stats({ completedSessions: 5, streak: { current: 7, longest: 7 } }));
    expect(items.map((i) => i.id)).toEqual(["c1", "u1", "r1"]);
  });
});

describe("unlockRequirementLabel", () => {
  it("has no requirement text for an always-eligible item", () => {
    expect(unlockRequirementLabel({ id: "c1", name: "Common", rarity: "common", eligibility: "always" })).toBe("");
  });

  it("describes a session-count gate, pluralized", () => {
    expect(
      unlockRequirementLabel({
        id: "u1",
        name: "Uncommon",
        rarity: "uncommon",
        eligibility: { minCompletedSessions: 5 },
      }),
    ).toBe("Complete 5 sessions to unlock");

    expect(
      unlockRequirementLabel({
        id: "u2",
        name: "Uncommon 2",
        rarity: "uncommon",
        eligibility: { minCompletedSessions: 1 },
      }),
    ).toBe("Complete 1 session to unlock");
  });

  it("describes a streak gate", () => {
    expect(
      unlockRequirementLabel({ id: "r1", name: "Rare", rarity: "rare", eligibility: { minStreakDays: 7 } }),
    ).toBe("Reach a 7-day streak to unlock");
  });
});

describe("unlockPoolItemToTankItem", () => {
  it("builds a TankItem from the matching catalog entry, keyed by the given instance id", () => {
    const unlockedAt = new Date("2026-01-01T00:00:00.000Z").toISOString();
    expect(unlockPoolItemToTankItem(UNLOCK_POOL, "clownfish", "instance-1", unlockedAt)).toEqual({
      id: "instance-1",
      speciesId: "clownfish",
      name: "Clownfish",
      rarity: "common",
      unlockedAt,
    });
  });

  it("falls back to the raw id/common rarity for an id not in the pool", () => {
    const unlockedAt = new Date("2026-01-01T00:00:00.000Z").toISOString();
    expect(unlockPoolItemToTankItem(UNLOCK_POOL, "not-a-real-item", "instance-1", unlockedAt)).toEqual({
      id: "instance-1",
      speciesId: "not-a-real-item",
      name: "not-a-real-item",
      rarity: "common",
      unlockedAt,
    });
  });

  it("allows two instances of the same species with different instance ids", () => {
    const unlockedAt = new Date("2026-01-01T00:00:00.000Z").toISOString();
    const first = unlockPoolItemToTankItem(UNLOCK_POOL, "clownfish", "instance-1", unlockedAt);
    const second = unlockPoolItemToTankItem(UNLOCK_POOL, "clownfish", "instance-2", unlockedAt);
    expect(first.id).not.toBe(second.id);
    expect(first.speciesId).toBe(second.speciesId);
  });
});
