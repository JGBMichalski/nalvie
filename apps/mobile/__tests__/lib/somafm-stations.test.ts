import { DEFAULT_SOMAFM_STATION_ID, SOMAFM_STATIONS, somafmStationName, somafmStreamUrl } from '../../lib/somafm-stations';

describe('somafm-stations', () => {
  it('has 5 curated stations with unique ids, Groove Salad first/default', () => {
    expect(SOMAFM_STATIONS).toHaveLength(5);
    expect(new Set(SOMAFM_STATIONS.map((s) => s.id)).size).toBe(5);
    expect(DEFAULT_SOMAFM_STATION_ID).toBe('groovesalad');
    expect(SOMAFM_STATIONS.some((s) => s.id === DEFAULT_SOMAFM_STATION_ID)).toBe(true);
  });

  describe('somafmStationName', () => {
    it('returns the display name for a known station', () => {
      expect(somafmStationName('groovesalad')).toBe('Groove Salad');
      expect(somafmStationName('dronezone')).toBe('Drone Zone');
    });

    it('falls back to the raw id for an unknown station', () => {
      expect(somafmStationName('not-a-real-station')).toBe('not-a-real-station');
    });
  });

  describe('somafmStreamUrl', () => {
    it('builds the stable per-station stream URL', () => {
      expect(somafmStreamUrl('groovesalad')).toBe('https://ice1.somafm.com/groovesalad-128-mp3');
      expect(somafmStreamUrl('fluid')).toBe('https://ice1.somafm.com/fluid-128-mp3');
    });
  });
});
