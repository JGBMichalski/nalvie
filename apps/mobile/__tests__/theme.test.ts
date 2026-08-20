import { theme } from '../theme';

const hexColor = /^#[0-9a-f]{6}$/i;
const rgbaColor = /^rgba\(\d+,\s*\d+,\s*\d+,\s*[\d.]+\)$/;

describe('theme', () => {
  it('defines every glass/tank color as a valid hex or rgba value', () => {
    for (const value of Object.values(theme.colors)) {
      expect(hexColor.test(value) || rgbaColor.test(value)).toBe(true);
    }
  });

  it('gives the FAB a larger radius than glass panels, per the FAB-as-primary-action design', () => {
    expect(theme.radii.fab).toBeGreaterThan(theme.radii.glass);
  });
});
