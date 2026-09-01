import { darkTheme, theme } from '../theme';

const hexColor = /^#[0-9a-f]{6}$/i;
const rgbaColor = /^rgba\(\d+,\s*\d+,\s*\d+,\s*[\d.]+\)$/;

describe('theme', () => {
  it('defines every glass/tank color as a valid hex or rgba value', () => {
    for (const value of Object.values(darkTheme.colors)) {
      expect(hexColor.test(value) || rgbaColor.test(value)).toBe(true);
    }
  });

  it('gives the FAB a larger radius than glass panels', () => {
    expect(darkTheme.radii.fab).toBeGreaterThan(darkTheme.radii.glass);
  });

  it('keeps the dark palette as the back-compat default `theme` export', () => {
    expect(theme).toBe(darkTheme);
  });
});
