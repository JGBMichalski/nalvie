import { describe, expect, it } from "vitest";
import { UNLOCK_POOL, pickReward, unlockPoolItemToTankItem } from "./unlock-pool.js";
import type { UnlockPoolItem } from "./unlock-pool.js";
import type { TankItem } from "./types.js";

function tankItem(id: string): TankItem {
  return { id, name: id, rarity: "common", unlockedAt: new Date().toISOString() };
}

function stats(overrides: Partial<{ completedSessions: number; streak: { current: number; longest: number } }> = {}) {
  return {
    completedSessions: 1,
    streak: { current: 0, longest: 0 },
    ...overrides,
  };
}

describe("UNLOCK_POOL", () => {
  it("has 18 items split 10 common / 6 uncommon / 2 rare", () => {
    expect(UNLOCK_POOL).toHaveLength(18);
    expect(UNLOCK_POOL.filter((i) => i.rarity === "common")).toHaveLength(10);
    expect(UNLOCK_POOL.filter((i) => i.rarity === "uncommon")).toHaveLength(6);
    expect(UNLOCK_POOL.filter((i) => i.rarity === "rare")).toHaveLength(2);
  });

  it("has unique ids", () => {
    const ids = UNLOCK_POOL.map((i) => i.id);
    expect(new Set(ids).size).toBe(ids.length);
  });
});

describe("pickReward", () => {
  const commonPool: UnlockPoolItem[] = [
    { id: "c1", name: "Common 1", rarity: "common", eligibility: "always" },
    { id: "c2", name: "Common 2", rarity: "common", eligibility: "always" },
  ];
  const uncommonPool: UnlockPoolItem[] = [
    { id: "u1", name: "Uncommon 1", rarity: "uncommon", eligibility: { minCompletedSessions: 5 } },
  ];
  const rarePool: UnlockPoolItem[] = [
    { id: "r1", name: "Rare 1", rarity: "rare", eligibility: { minStreakDays: 7 } },
  ];
  const fullPool = [...commonPool, ...uncommonPool, ...rarePool];

  it("only ever picks common items before any gate opens", () => {
    // random() = 0.99 would normally roll "rare" territory if uncommon/rare were
    // eligible, but with none eligible yet, common is the only option regardless.
    const id = pickReward(fullPool, [], stats({ completedSessions: 1 }), () => 0.99);
    expect(commonPool.map((i) => i.id)).toContain(id);
  });

  it("does not offer uncommon items before 5 completed sessions", () => {
    for (let i = 0; i < 20; i++) {
      const id = pickReward(fullPool, [], stats({ completedSessions: 4 }), () => i / 20);
      expect(id).not.toBe("u1");
    }
  });

  it("offers uncommon items once 5 sessions are completed", () => {
    // Force the "uncommon" rarity band: common=0..0.7, uncommon=0.7..0.95, rare=0.95..1
    const id = pickReward(fullPool, [], stats({ completedSessions: 5 }), () => 0.8);
    expect(id).toBe("u1");
  });

  it("does not offer rare items before a 7-day streak", () => {
    const id = pickReward(fullPool, [], stats({ completedSessions: 10, streak: { current: 6, longest: 6 } }), () => 0.99);
    expect(id).not.toBe("r1");
  });

  it("offers rare items once a 7-day streak is reached", () => {
    const id = pickReward(
      fullPool,
      [],
      stats({ completedSessions: 10, streak: { current: 7, longest: 7 } }),
      () => 0.99,
    );
    expect(id).toBe("r1");
  });

  it("prefers an un-unlocked eligible item over a duplicate", () => {
    // c1 is already unlocked; c2 is not. Even if the first internal roll
    // happens to land on the duplicate (c1), the reroll should recover c2.
    let call = 0;
    const random = () => {
      call += 1;
      // First roll (rarity + item) lands on c1 (already unlocked); the reroll
      // should be steered towards c2 instead.
      return call <= 2 ? 0 : 0.9;
    };
    const id = pickReward(commonPool, [tankItem("c1")], stats(), random);
    expect(id).toBe("c2");
  });

  it("rerolls specifically among the fresh items in the tier, not the whole eligible set", () => {
    const threeItemPool: UnlockPoolItem[] = [
      { id: "c1", name: "Common 1", rarity: "common", eligibility: "always" },
      { id: "c2", name: "Common 2", rarity: "common", eligibility: "always" },
      { id: "c3", name: "Common 3", rarity: "common", eligibility: "always" },
    ];
    let call = 0;
    const random = () => {
      call += 1;
      if (call === 1) return 0; // rarity roll -> common (the only eligible rarity)
      // Both the first pick and the reroll use a low value — if the reroll
      // resampled the whole eligible set (a bug), it would land on c1 again
      // (a duplicate); resampling just the fresh items must land on c3.
      return 0.1;
    };
    const id = pickReward(threeItemPool, [tankItem("c1"), tankItem("c2")], stats(), random);
    expect(id).toBe("c3");
  });

  it("allows a duplicate once every eligible item in the rolled rarity is unlocked", () => {
    const id = pickReward(commonPool, [tankItem("c1"), tankItem("c2")], stats(), () => 0);
    expect(commonPool.map((i) => i.id)).toContain(id);
  });

  it("renormalizes odds across only the currently-eligible rarities", () => {
    // With only uncommon eligible (no common items in pool at all here),
    // any random() draw should still resolve to the single eligible item.
    const onlyUncommon = [uncommonPool[0]];
    const id = pickReward(onlyUncommon, [], stats({ completedSessions: 5 }), () => 0.5);
    expect(id).toBe("u1");
  });
});

describe("unlockPoolItemToTankItem", () => {
  it("builds a TankItem from the matching catalog entry", () => {
    const unlockedAt = new Date("2026-01-01T00:00:00.000Z").toISOString();
    expect(unlockPoolItemToTankItem(UNLOCK_POOL, "clownfish", unlockedAt)).toEqual({
      id: "clownfish",
      name: "Clownfish",
      rarity: "common",
      unlockedAt,
    });
  });

  it("falls back to the raw id/common rarity for an id not in the pool", () => {
    const unlockedAt = new Date("2026-01-01T00:00:00.000Z").toISOString();
    expect(unlockPoolItemToTankItem(UNLOCK_POOL, "not-a-real-item", unlockedAt)).toEqual({
      id: "not-a-real-item",
      name: "not-a-real-item",
      rarity: "common",
      unlockedAt,
    });
  });
});
