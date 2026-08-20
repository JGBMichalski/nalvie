import { MAX_PITCH_DEGREES, travelPitchDegrees } from '../../lib/swim-geometry';

describe('travelPitchDegrees', () => {
  it('is level for purely horizontal travel', () => {
    expect(travelPitchDegrees(10, 0)).toBe(0);
    expect(travelPitchDegrees(-10, 0)).toBe(-0);
  });

  it('points the nose up when swimming right and up', () => {
    // Negative rotation is anticlockwise, which lifts a nose-right creature.
    expect(travelPitchDegrees(10, -10)).toBeCloseTo(-45);
  });

  it('points the nose down when swimming right and down', () => {
    expect(travelPitchDegrees(10, 10)).toBeCloseTo(45);
  });

  it('inverts the angle when swimming left, because the creature is mirrored', () => {
    // Same upward travel as the right-and-up case, but mirrored, so the sign flips.
    expect(travelPitchDegrees(-10, -10)).toBeCloseTo(45);
    expect(travelPitchDegrees(-10, 10)).toBeCloseTo(-45);
  });

  it('clamps steep travel so nothing swims nose-vertical', () => {
    expect(travelPitchDegrees(1, 500)).toBe(MAX_PITCH_DEGREES);
    expect(travelPitchDegrees(-1, 500)).toBe(-MAX_PITCH_DEGREES);
  });

  it('is level when there is no travel at all', () => {
    expect(travelPitchDegrees(0, 0)).toBe(0);
  });
});
