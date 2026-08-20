// Creature art is drawn nose-right. Swimmers heading left are mirrored with scaleX,
// which also mirrors their rotation, so the pitch for a left-bound creature is the
// negation of the naive travel angle.

// Fish stay readable up to a point; past this they'd swim nose-vertical.
export const MAX_PITCH_DEGREES = 50;

/**
 * Nose angle for a creature travelling by (dx, dy), in screen coordinates where
 * dy grows downward. Returns degrees to apply *before* the horizontal flip.
 */
export function travelPitchDegrees(dx: number, dy: number): number {
  'worklet'; // also runs inside the tank simulation's per-frame worklet
  if (dx === 0 && dy === 0) return 0;

  const radians = Math.atan2(dy, Math.abs(dx));
  const mirrored = dx < 0 ? -1 : 1;
  const degrees = (radians * 180) / Math.PI;

  return Math.max(-MAX_PITCH_DEGREES, Math.min(MAX_PITCH_DEGREES, degrees * mirrored));
}
