/**
 * Per-species movement personality.
 */
export interface SpeciesProfile {
  cruiseSpeed: number; // px/s at 1.0 speed factor
  burstThrust: number; // px/s² applied during a tail-beat burst
  drag: number; // px/s² applied to slow down a swimmer
  turnRate: number; // Radians/s of heading change at 1.0 turn factor
  wander: number; // Radians/s of random heading change at 1.0 wander factor
  burstPeriod: number; // s per tail-beat cycle, including glide
  school: string; // School name for social cohesion, or '' for none.
  preferredDepth: number; // 0..1, where 0 is the top of the tank and 1 is the bottom; -1 for no preference.
  depthPull: number; // 0..1, how strongly the creature is pulled toward its preferred depth.
  radius: number; // px, for collision avoidance and wall repulsion
  flips: boolean; // Whether the creature's artwork should flip to face its travel direction.
  aspect: number; // width/height ratio of the artwork, for collision avoidance and wall repulsion
}

const DEFAULT: SpeciesProfile = {
  cruiseSpeed: 26,
  burstThrust: 190,
  drag: 1.7,
  turnRate: 1.6,
  wander: 1.1,
  burstPeriod: 1.5,
  school: '',
  preferredDepth: -1,
  depthPull: 0,
  radius: 40,
  flips: true,
  aspect: 72 / 40,
};

const PROFILES: Record<string, Partial<SpeciesProfile>> = {
  // Bold and inquisitive, holds no particular depth.
  clownfish: { cruiseSpeed: 30, burstPeriod: 1.2, wander: 1.3, aspect: 72 / 40 },

  // Small, flighty, loosely social.
  guppy: {
    cruiseSpeed: 34,
    burstThrust: 230,
    burstPeriod: 0.85,
    wander: 1.8,
    turnRate: 2.6,
    radius: 30,
    school: 'guppy',
    preferredDepth: 0.35,
    depthPull: 0.25,
    aspect: 70 / 40,
  },

  // The tightest schooler, fastest darts, hangs in the upper water.
  'neon-tetra': {
    cruiseSpeed: 40,
    burstThrust: 300,
    drag: 2.1,
    burstPeriod: 0.6,
    wander: 2.2,
    turnRate: 3.2,
    radius: 24,
    school: 'tetra',
    preferredDepth: 0.28,
    depthPull: 0.35,
    aspect: 60 / 32,
  },

  // Heavy and unhurried; turns like a barge.
  goldfish: {
    cruiseSpeed: 22,
    burstThrust: 150,
    drag: 1.3,
    burstPeriod: 1.9,
    wander: 0.7,
    turnRate: 1.0,
    radius: 46,
    aspect: 76 / 44,
  },

  // Skitters along near the floor in short nervous hops.
  shrimp: {
    cruiseSpeed: 18,
    burstThrust: 260,
    drag: 3.2,
    burstPeriod: 0.7,
    wander: 2.6,
    turnRate: 3.0,
    radius: 26,
    preferredDepth: 0.86,
    depthPull: 0.6,
    aspect: 72 / 40,
  },

  // Glides serenely, holds mid-water, and is large enough to part a crowd.
  angelfish: {
    cruiseSpeed: 20,
    burstThrust: 130,
    drag: 1.2,
    burstPeriod: 2.2,
    wander: 0.6,
    turnRate: 1.1,
    radius: 48,
    preferredDepth: 0.45,
    depthPull: 0.3,
    aspect: 60 / 96,
  },

  // Barely travels at all — mostly holds station.
  seahorse: {
    cruiseSpeed: 9,
    burstThrust: 70,
    drag: 2.4,
    burstPeriod: 2.6,
    wander: 0.9,
    turnRate: 0.9,
    radius: 34,
    preferredDepth: 0.62,
    depthPull: 0.5,
    aspect: 46 / 78,
  },

  // Drifts on its own propulsion, never turns to face anywhere.
  jellyfish: {
    cruiseSpeed: 13,
    burstThrust: 110,
    drag: 1.9,
    burstPeriod: 1.8,
    wander: 0.35,
    turnRate: 0.5,
    radius: 40,
    flips: false,
    preferredDepth: 0.3,
    depthPull: 0.18,
    aspect: 56 / 80,
  },

  // Big, slow, and everything else keeps out of its way.
  'sea-turtle': {
    cruiseSpeed: 24,
    burstThrust: 160,
    drag: 1.1,
    burstPeriod: 2.6,
    wander: 0.5,
    turnRate: 0.8,
    radius: 58,
    aspect: 84 / 60,
  },
};

export function speciesProfile(itemId: string): SpeciesProfile {
  return { ...DEFAULT, ...PROFILES[itemId] };
}
