import { describe, expect, it } from "vitest";

import {
  DEFAULT_TANK_THEME_ID,
  TANK_THEMES,
  tankThemeById,
} from "./tank-themes.js";

describe("tank themes", () => {
  it("ships seven themes with unique ids", () => {
    expect(TANK_THEMES).toHaveLength(7);
    const ids = TANK_THEMES.map((theme) => theme.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("every palette defines every hex color key", () => {
    const keys = [
      "waterFrom",
      "waterMid",
      "waterTo",
      "sunglow",
      "shaft",
      "duneLight",
      "dune",
      "duneDeep",
      "mote",
      "accent",
      "accentForeground",
    ] as const;
    for (const theme of TANK_THEMES) {
      for (const key of keys) {
        expect(theme.palette[key]).toMatch(/^#[0-9a-f]{6}$/i);
      }
    }
  });

  it("every palette defines a translucent glass background and border", () => {
    const rgba = /^rgba\(\d+,\s*\d+,\s*\d+,\s*[\d.]+\)$/;
    for (const theme of TANK_THEMES) {
      expect(theme.palette.glassBackground).toMatch(rgba);
      expect(theme.palette.glassBorder).toMatch(rgba);
    }
  });

  it("gives dark-water themes the light glass tint, and bright themes the dark tint", () => {
    expect(tankThemeById("reef").palette.glassBackground).toBe("rgba(255, 255, 255, 0.08)");
    expect(tankThemeById("tropical").palette.glassBackground).toBe("rgba(0, 0, 0, 0.4)");
  });

  it("resolves a known id to its theme", () => {
    expect(tankThemeById("twilight").name).toBe("Twilight");
  });

  it("falls back to the default theme for an unknown id", () => {
    expect(tankThemeById("does-not-exist").id).toBe(DEFAULT_TANK_THEME_ID);
  });
});
