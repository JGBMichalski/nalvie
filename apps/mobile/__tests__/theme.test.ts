import { darkTheme, lightTheme, resolveColorScheme, theme, themeForScheme } from '../theme';

const hexColor = /^#[0-9a-f]{6}$/i;
const rgbaColor = /^rgba\(\d+,\s*\d+,\s*\d+,\s*[\d.]+\)$/;

describe('theme', () => {
  for (const [name, palette] of [
    ['dark', darkTheme],
    ['light', lightTheme],
  ] as const) {
    it(`(${name}) defines every glass/tank color as a valid hex or rgba value`, () => {
      for (const value of Object.values(palette.colors)) {
        expect(hexColor.test(value) || rgbaColor.test(value)).toBe(true);
      }
    });

    it(`(${name}) gives the FAB a larger radius than glass panels`, () => {
      expect(palette.radii.fab).toBeGreaterThan(palette.radii.glass);
    });
  }

  it('the light and dark palettes expose the same set of color keys', () => {
    expect(Object.keys(lightTheme.colors).sort()).toEqual(Object.keys(darkTheme.colors).sort());
  });

  it('keeps the dark palette as the back-compat default `theme` export', () => {
    expect(theme).toBe(darkTheme);
  });

  describe('resolveColorScheme', () => {
    it('follows the system scheme when the override is null', () => {
      expect(resolveColorScheme(null, 'light')).toBe('light');
      expect(resolveColorScheme(null, 'dark')).toBe('dark');
    });

    it('honours an explicit override regardless of system scheme', () => {
      expect(resolveColorScheme(true, 'light')).toBe('dark');
      expect(resolveColorScheme(false, 'dark')).toBe('light');
    });
  });

  describe('themeForScheme', () => {
    it('maps each scheme to its palette', () => {
      expect(themeForScheme('light')).toBe(lightTheme);
      expect(themeForScheme('dark')).toBe(darkTheme);
    });
  });
});
