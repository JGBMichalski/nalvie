import { describe, expect, it } from "vitest";
import { STARTER_SPECIES_IDS, UNLOCK_POOL, unlockPoolItemToTankItem } from "./unlock-pool.js";

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

describe("STARTER_SPECIES_IDS", () => {
  it("is clownfish and guppy, both present in the pool", () => {
    expect(STARTER_SPECIES_IDS).toEqual(["clownfish", "guppy"]);
    for (const id of STARTER_SPECIES_IDS) {
      expect(UNLOCK_POOL.some((item) => item.id === id)).toBe(true);
    }
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
