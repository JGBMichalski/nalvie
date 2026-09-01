export interface TankThemePalette {
  waterFrom: string; // top of the water gradient
  waterMid: string; // middle of the water gradient
  waterTo: string; // bottom of the water gradient
  sunglow: string; // sunlight bloom + crest highlights
  shaft: string; // drifting light shafts
  duneLight: string; // lit face of the sand/rock
  dune: string; // mid tone of the substrate
  duneDeep: string; // deepest substrate + vignette
  mote: string; // suspended particles catching the light
  accent: string; // primary action color (play button, selected values, sliders)
  accentForeground: string; // readable foreground on top of `accent`
  glassBackground: string; // translucent chrome background for panels/sheets/buttons
  glassBorder: string; // translucent chrome border for panels/sheets/buttons
}

export type TankThemeId =
  | "reef"
  | "twilight"
  | "kelp"
  | "abyss"
  | "tropical"
  | "lagoon"
  | "sunrise";

export interface TankTheme {
  id: TankThemeId;
  name: string;
  palette: TankThemePalette;
}

// Dark-water themes read fine with a light-tinted glass.
// Bright themes need a darker tint.
const GLASS_ON_DARK_WATER = {
  glassBackground: "rgba(255, 255, 255, 0.08)",
  glassBorder: "rgba(255, 255, 255, 0.15)",
};
const GLASS_ON_BRIGHT_WATER = {
  glassBackground: "rgba(0, 0, 0, 0.4)",
  glassBorder: "rgba(255, 255, 255, 0.12)",
};

// Default theme
const REEF: TankTheme = {
  id: "reef",
  name: "Reef",
  palette: {
    waterFrom: "#112233",
    waterMid: "#0a1c2e",
    waterTo: "#001018",
    sunglow: "#7fd4e8",
    shaft: "#a8e6f2",
    duneLight: "#2e4a5c",
    dune: "#1a2f3f",
    duneDeep: "#0a1822",
    mote: "#bfeaf5",
    accent: "#1fd1a7",
    accentForeground: "#00251c",
    ...GLASS_ON_DARK_WATER,
  },
};

// Warm dusk light bleeding through purpled water.
const TWILIGHT: TankTheme = {
  id: "twilight",
  name: "Twilight",
  palette: {
    waterFrom: "#3a2a4d",
    waterMid: "#241832",
    waterTo: "#100a1c",
    sunglow: "#f0a9c0",
    shaft: "#ffcf94",
    duneLight: "#5a4468",
    dune: "#382a45",
    duneDeep: "#1a1226",
    mote: "#ffd9c2",
    accent: "#ff9e6d",
    accentForeground: "#2c1206",
    ...GLASS_ON_DARK_WATER,
  },
};

// A green kelp forest — moss-lit and thick with drifting particulate.
const KELP: TankTheme = {
  id: "kelp",
  name: "Kelp Forest",
  palette: {
    waterFrom: "#1d3a2e",
    waterMid: "#12281f",
    waterTo: "#061109",
    sunglow: "#b7e88a",
    shaft: "#d6f2a0",
    duneLight: "#3f5a3a",
    dune: "#263a24",
    duneDeep: "#0f1c10",
    mote: "#e2f5bf",
    accent: "#9cd94a",
    accentForeground: "#14260a",
    ...GLASS_ON_DARK_WATER,
  },
};

// The cold deep — near-black water and faint bioluminescent motes.
const ABYSS: TankTheme = {
  id: "abyss",
  name: "Abyss",
  palette: {
    waterFrom: "#0a1622",
    waterMid: "#050c14",
    waterTo: "#01030a",
    sunglow: "#4c8fd6",
    shaft: "#6fb0f0",
    duneLight: "#1c2c3e",
    dune: "#101c2a",
    duneDeep: "#040810",
    mote: "#9fd0ff",
    accent: "#4aa3ff",
    accentForeground: "#02121f",
    ...GLASS_ON_DARK_WATER,
  },
};

// Bright, sun-drenched shallows over pale coral sand.
const TROPICAL: TankTheme = {
  id: "tropical",
  name: "Tropical Shallows",
  palette: {
    waterFrom: "#37c6d4",
    waterMid: "#1a94b8",
    waterTo: "#0a5a86",
    sunglow: "#fff4c2",
    shaft: "#ffffff",
    duneLight: "#e8d9a8",
    dune: "#c7b47e",
    duneDeep: "#8a7a54",
    mote: "#ffffff",
    accent: "#ff7043",
    accentForeground: "#ffffff",
    ...GLASS_ON_BRIGHT_WATER,
  },
};

// A vivid turquoise lagoon over near-white sand.
const LAGOON: TankTheme = {
  id: "lagoon",
  name: "Lagoon",
  palette: {
    waterFrom: "#5ae0d0",
    waterMid: "#2bb8c4",
    waterTo: "#1682a6",
    sunglow: "#eafff4",
    shaft: "#ffffff",
    duneLight: "#f2ecd6",
    dune: "#d8cba4",
    duneDeep: "#9c8f66",
    mote: "#ffffff",
    accent: "#ff5d8f",
    accentForeground: "#ffffff",
    ...GLASS_ON_BRIGHT_WATER,
  },
};

// Warm, sunlit shallows glowing peach and gold at first light.
const SUNRISE: TankTheme = {
  id: "sunrise",
  name: "Sunrise",
  palette: {
    waterFrom: "#ffd9a0",
    waterMid: "#ff9e7a",
    waterTo: "#e86f8f",
    sunglow: "#fff6dd",
    shaft: "#ffffff",
    duneLight: "#ffe6c0",
    dune: "#e0a978",
    duneDeep: "#a86b52",
    mote: "#fff2e0",
    accent: "#8a4dff",
    accentForeground: "#ffffff",
    ...GLASS_ON_BRIGHT_WATER,
  },
};

export const TANK_THEMES: readonly TankTheme[] = [
  REEF,
  TWILIGHT,
  KELP,
  ABYSS,
  TROPICAL,
  LAGOON,
  SUNRISE,
];

export const DEFAULT_TANK_THEME_ID: TankThemeId = "reef";

export function tankThemeById(id: string): TankTheme {
  return TANK_THEMES.find((theme) => theme.id === id) ?? REEF;
}
