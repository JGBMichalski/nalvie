// Curated SomaFM station list. Deliberately hardcoded rather than
// fetched from https://somafm.com/developer/'s channels.json directory API.
// If SomaFM ever rotates these specific stream endpoints, update the table.

export interface SomaFmStation {
  id: string;
  name: string;
}

export const SOMAFM_STATIONS: SomaFmStation[] = [
  { id: 'groovesalad', name: 'Groove Salad' },
  { id: 'gsclassic', name: 'Groove Salad Classic' },
  { id: 'beatblender', name: 'Beat Blender' },
  { id: 'dronezone', name: 'Drone Zone' },
  { id: 'fluid', name: 'Fluid' },
];

export const DEFAULT_SOMAFM_STATION_ID = 'groovesalad';

export function somafmStationName(stationId: string): string {
  return SOMAFM_STATIONS.find((station) => station.id === stationId)?.name ?? stationId;
}

export function somafmStreamUrl(stationId: string): string {
  return `https://ice1.somafm.com/${stationId}-128-mp3`;
}
