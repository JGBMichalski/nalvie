import { travelPitchDegrees } from './swim-geometry';
import { speciesProfile, type SpeciesProfile } from './tank-species';

/**
 * A steering simulation for the tank, in the spirit of Reynolds' boids.
 *
 * Everything here is a plain function marked `worklet` so the same code can be
 * unit-tested on the JS thread and run per-frame on reanimated's UI thread. It
 * must stay free of closures over React state, `Math.random`, and Date — agents
 * carry their own seeded RNG so runs are reproducible.
 */

export interface Agent {
  id: string;
  x: number;
  y: number;
  heading: number; // Radians, 0 = right, π/2 = down, etc.
  speed: number; // Pixels per second, 0..cruiseSpeed*MAX_SPEED_FACTOR
  phase: number; // 0..1, where 0 is the start of a burst and 1 is the end of a glide
  flip: number; // 1 = facing right, -1 = facing left; eased toward the target each frame
  pitch: number; // Nose angle in degrees, clamped to ±MAX_PITCH_DEGREES, where 0 is horizontal
  rng: number;
  halfWidth: number;
  halfHeight: number;
  profile: SpeciesProfile;
}

const SEPARATION = 2.4; // How strongly a creature steers away from neighbours that are too close, in units of 1/sec.
const COHESION = 0.5; // How strongly a creature steers toward the centre of its schoolmates, in units of 1/sec.
const ALIGNMENT = 0.7; // How strongly a creature steers to match its schoolmates' headings.
const SCHOOL_RADIUS = 150; // How far a creature looks for schoolmates, in pixels.
const WALL_FORCE = 3.2; // How strongly walls repel swimmers, in units of cruiseSpeed/sec.
const WALL_MARGIN = 56; // Pixels from the edge of the tank where walls start repelling swimmers.
const BURST_FRACTION = 0.32; // Fraction of the burst period spent accelerating; the rest is coasting on drag.
const FLIP_RATE = 3.4; // How quickly the facing flip eases toward the target, in units of 1/sec. A value of 1 would take ~1s to complete.
const MAX_SPEED_FACTOR = 2.2; // How much faster than cruiseSpeed a swimmer can go at the peak of a burst.

function nextRandom(agent: Agent): number {
  'worklet';
  agent.rng = (agent.rng * 1664525 + 1013904223) >>> 0;
  return agent.rng / 0x100000000;
}

function hashSeed(text: string): number {
  let state = 0;
  for (let i = 0; i < text.length; i++) state = (state * 31 + text.charCodeAt(i)) >>> 0;
  // Avoid a zero state, which would freeze the LCG's low bits early on.
  return (state ^ 0x9e3779b9) >>> 0;
}

/** Shortest signed angular distance from `from` to `to`, in radians. */
export function angleDelta(from: number, to: number): number {
  'worklet';
  let delta = (to - from) % (Math.PI * 2);
  if (delta > Math.PI) delta -= Math.PI * 2;
  if (delta < -Math.PI) delta += Math.PI * 2;
  return delta;
}

export function createAgent(
  id: string,
  swimmerSize: number,
  width: number,
  height: number,
): Agent {
  const profile = speciesProfile(id);
  const halfWidth = swimmerSize / 2;
  const halfHeight = swimmerSize / profile.aspect / 2;

  const agent: Agent = {
    id,
    x: 0,
    y: 0,
    heading: 0,
    speed: profile.cruiseSpeed,
    phase: 0,
    flip: 1,
    pitch: 0,
    rng: hashSeed(id),
    halfWidth,
    halfHeight,
    profile,
  };

  agent.x = halfWidth + nextRandom(agent) * Math.max(1, width - swimmerSize);
  const depth = profile.preferredDepth >= 0 ? profile.preferredDepth : nextRandom(agent);
  agent.y = Math.min(
    Math.max(depth * height, halfHeight),
    Math.max(halfHeight, height - halfHeight),
  );
  agent.heading = nextRandom(agent) * Math.PI * 2;
  agent.phase = nextRandom(agent);
  agent.flip = Math.cos(agent.heading) >= 0 || !profile.flips ? 1 : -1;

  return agent;
}

export function createAgents(
  ids: string[],
  swimmerSize: number,
  width: number,
  height: number,
): Agent[] {
  const agents: Agent[] = [];
  for (let i = 0; i < ids.length; i++) agents.push(createAgent(ids[i], swimmerSize, width, height));
  return agents;
}

/** Advances every agent by `dt` seconds. Mutates in place. */
export function stepAgents(agents: Agent[], width: number, height: number, dt: number): void {
  'worklet';
  if (width <= 0 || height <= 0 || dt <= 0) return;

  for (let i = 0; i < agents.length; i++) {
    const agent = agents[i];
    const profile = agent.profile;

    // Start from the current heading, nudged by a random walk. Steering is
    // accumulated as a direction vector so the influences blend smoothly.
    const drift = (nextRandom(agent) * 2 - 1) * profile.wander * dt;
    let steerX = Math.cos(agent.heading + drift);
    let steerY = Math.sin(agent.heading + drift);

    let schoolX = 0;
    let schoolY = 0;
    let schoolHeadingX = 0;
    let schoolHeadingY = 0;
    let schoolmates = 0;

    for (let j = 0; j < agents.length; j++) {
      if (j === i) continue;
      const other = agents[j];
      const dx = agent.x - other.x;
      const dy = agent.y - other.y;
      const distance = Math.sqrt(dx * dx + dy * dy);
      if (distance <= 0.001) continue;

      // Personal space. Bigger neighbours push harder, so small fish give the
      // turtle a wide berth rather than the other way round.
      const personal = profile.radius + other.profile.radius;
      if (distance < personal) {
        const crowding = (personal - distance) / personal;
        const weight = (crowding * other.profile.radius) / profile.radius;
        steerX += (dx / distance) * weight * SEPARATION;
        steerY += (dy / distance) * weight * SEPARATION;
      }

      if (profile.school !== '' && profile.school === other.profile.school) {
        if (distance < SCHOOL_RADIUS) {
          schoolX += other.x;
          schoolY += other.y;
          schoolHeadingX += Math.cos(other.heading);
          schoolHeadingY += Math.sin(other.heading);
          schoolmates++;
        }
      }
    }

    if (schoolmates > 0) {
      const centreX = schoolX / schoolmates;
      const centreY = schoolY / schoolmates;
      const toCentreX = centreX - agent.x;
      const toCentreY = centreY - agent.y;
      const centreDistance = Math.sqrt(toCentreX * toCentreX + toCentreY * toCentreY);
      if (centreDistance > 0.001) {
        steerX += (toCentreX / centreDistance) * COHESION;
        steerY += (toCentreY / centreDistance) * COHESION;
      }
      const alignLength = Math.sqrt(
        schoolHeadingX * schoolHeadingX + schoolHeadingY * schoolHeadingY,
      );
      if (alignLength > 0.001) {
        steerX += (schoolHeadingX / alignLength) * ALIGNMENT;
        steerY += (schoolHeadingY / alignLength) * ALIGNMENT;
      }
    }

    if (profile.preferredDepth >= 0) {
      const targetY = profile.preferredDepth * height;
      const offset = (targetY - agent.y) / height;
      steerY += Math.max(-1, Math.min(1, offset * 3)) * profile.depthPull;
    }

    // Walls repel from a distance so creatures curve away instead of bouncing.
    const left = agent.x - agent.halfWidth;
    const right = width - agent.halfWidth - agent.x;
    const top = agent.y - agent.halfHeight;
    const bottom = height - agent.halfHeight - agent.y;
    if (left < WALL_MARGIN) steerX += ((WALL_MARGIN - left) / WALL_MARGIN) * WALL_FORCE;
    if (right < WALL_MARGIN) steerX -= ((WALL_MARGIN - right) / WALL_MARGIN) * WALL_FORCE;
    if (top < WALL_MARGIN) steerY += ((WALL_MARGIN - top) / WALL_MARGIN) * WALL_FORCE;
    if (bottom < WALL_MARGIN) steerY -= ((WALL_MARGIN - bottom) / WALL_MARGIN) * WALL_FORCE;

    if (steerX !== 0 || steerY !== 0) {
      const desired = Math.atan2(steerY, steerX);
      const turn = angleDelta(agent.heading, desired);
      const maxTurn = profile.turnRate * dt;
      agent.heading += Math.max(-maxTurn, Math.min(maxTurn, turn));
    }

    // Burst-and-glide: a short thrust at the top of each beat, then coasting on
    // drag alone. This is what stops every creature dead-stopping at a waypoint.
    agent.phase += dt / profile.burstPeriod;
    while (agent.phase >= 1) agent.phase -= 1;
    const envelope = agent.phase < BURST_FRACTION ? 1 - agent.phase / BURST_FRACTION : 0;
    agent.speed += profile.burstThrust * envelope * dt;
    agent.speed -= agent.speed * profile.drag * dt;
    const maxSpeed = profile.cruiseSpeed * MAX_SPEED_FACTOR;
    if (agent.speed > maxSpeed) agent.speed = maxSpeed;
    if (agent.speed < 0) agent.speed = 0;

    const dirX = Math.cos(agent.heading);
    const dirY = Math.sin(agent.heading);
    agent.x += dirX * agent.speed * dt;
    agent.y += dirY * agent.speed * dt;

    // Containment backstop, in case a creature is pushed past a wall by crowding.
    const minX = agent.halfWidth;
    const maxX = Math.max(minX, width - agent.halfWidth);
    const minY = agent.halfHeight;
    const maxY = Math.max(minY, height - agent.halfHeight);
    if (agent.x < minX) agent.x = minX;
    if (agent.x > maxX) agent.x = maxX;
    if (agent.y < minY) agent.y = minY;
    if (agent.y > maxY) agent.y = maxY;

    // Facing eases rather than snapping, so a turn reads as the body rotating.
    const targetFlip = !profile.flips ? 1 : dirX >= 0 ? 1 : -1;
    const flipStep = FLIP_RATE * dt;
    const flipDelta = targetFlip - agent.flip;
    agent.flip += Math.max(-flipStep, Math.min(flipStep, flipDelta));

    // Pitch takes its mirror sign from `flip`, not from the heading, so the nose
    // never pops before the body has finished turning around.
    if (profile.flips) {
      const mirrored = agent.flip >= 0 ? Math.abs(dirX) : -Math.abs(dirX);
      agent.pitch = travelPitchDegrees(mirrored, dirY);
    } else {
      agent.pitch = 0;
    }
  }
}
