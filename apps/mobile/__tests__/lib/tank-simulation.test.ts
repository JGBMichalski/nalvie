import {
  angleDelta,
  createAgent,
  createAgents,
  reconcileAgents,
  stepAgents,
  type Agent,
} from '../../lib/tank-simulation';

const WIDTH = 320;
const HEIGHT = 560;
const SIZE = 72;
const DT = 1 / 60;

function run(agents: Agent[], seconds: number, width = WIDTH, height = HEIGHT) {
  const steps = Math.round(seconds / DT);
  for (let i = 0; i < steps; i++) stepAgents(agents, width, height, DT);
  return agents;
}

function speedsOver(agent: Agent, seconds: number): number[] {
  const samples: number[] = [];
  const steps = Math.round(seconds / DT);
  for (let i = 0; i < steps; i++) {
    stepAgents([agent], WIDTH, HEIGHT, DT);
    samples.push(agent.speed);
  }
  return samples;
}

describe('angleDelta', () => {
  it('takes the short way round the circle', () => {
    expect(angleDelta(0, Math.PI / 2)).toBeCloseTo(Math.PI / 2);
    // Turning from just below 2π to just above 0 is a small step, not a full lap.
    expect(angleDelta(6.2, 0.1)).toBeCloseTo(0.1 - 6.2 + Math.PI * 2);
    expect(Math.abs(angleDelta(0.1, 6.2))).toBeLessThan(0.3);
  });
});

describe('containment', () => {
  it('keeps every species inside the tank over a long run', () => {
    const ids = [
      'clownfish',
      'guppy',
      'neon-tetra',
      'goldfish',
      'shrimp',
      'angelfish',
      'seahorse',
      'jellyfish',
      'sea-turtle',
    ];
    const agents = createAgents(ids, SIZE, WIDTH, HEIGHT);

    run(agents, 120);

    for (const agent of agents) {
      expect(agent.x).toBeGreaterThanOrEqual(agent.halfWidth - 0.001);
      expect(agent.x).toBeLessThanOrEqual(WIDTH - agent.halfWidth + 0.001);
      expect(agent.y).toBeGreaterThanOrEqual(agent.halfHeight - 0.001);
      expect(agent.y).toBeLessThanOrEqual(HEIGHT - agent.halfHeight + 0.001);
    }
  });

  it('curves away from a wall instead of pinning against it', () => {
    const agent = createAgent('clownfish', SIZE, WIDTH, HEIGHT);
    agent.x = WIDTH - agent.halfWidth - 4;
    agent.y = HEIGHT / 2;
    agent.heading = 0; // driving straight at the right-hand wall

    run([agent], 3);

    // It should have turned back toward open water rather than sitting on the edge.
    expect(Math.cos(agent.heading)).toBeLessThan(0);
    expect(agent.x).toBeLessThan(WIDTH - agent.halfWidth - 10);
  });
});

describe('burst and glide', () => {
  it('varies speed within each beat rather than cruising at a constant rate', () => {
    const agent = createAgent('clownfish', SIZE, WIDTH, HEIGHT);
    const speeds = speedsOver(agent, 6);

    const fastest = Math.max(...speeds);
    const slowest = Math.min(...speeds);
    // A meaningful thrust/coast swing, not a flat tween.
    expect(fastest / slowest).toBeGreaterThan(1.5);
  });

  it('never comes to a dead stop mid-cycle', () => {
    const agent = createAgent('goldfish', SIZE, WIDTH, HEIGHT);
    const speeds = speedsOver(agent, 10).slice(60); // ignore the spin-up

    expect(Math.min(...speeds)).toBeGreaterThan(1);
  });

  it('gives each species a distinct tempo', () => {
    const tetra = createAgent('neon-tetra', SIZE, WIDTH, HEIGHT);
    const turtle = createAgent('sea-turtle', SIZE, WIDTH, HEIGHT);
    const seahorse = createAgent('seahorse', SIZE, WIDTH, HEIGHT);

    const average = (agent: Agent) => {
      const speeds = speedsOver(agent, 8).slice(60);
      return speeds.reduce((sum, value) => sum + value, 0) / speeds.length;
    };

    const tetraSpeed = average(tetra);
    const turtleSpeed = average(turtle);
    const seahorseSpeed = average(seahorse);

    expect(tetraSpeed).toBeGreaterThan(turtleSpeed);
    expect(turtleSpeed).toBeGreaterThan(seahorseSpeed);
  });
});

describe('personal space', () => {
  it('pushes two overlapping creatures apart', () => {
    const a = createAgent('clownfish', SIZE, WIDTH, HEIGHT);
    const b = createAgent('goldfish', SIZE, WIDTH, HEIGHT);
    a.x = 160;
    a.y = 280;
    b.x = 168;
    b.y = 284;

    const before = Math.hypot(a.x - b.x, a.y - b.y);
    run([a, b], 4);
    const after = Math.hypot(a.x - b.x, a.y - b.y);

    expect(after).toBeGreaterThan(before);
  });
});

describe('schooling', () => {
  it('draws schoolmates together', () => {
    const a = createAgent('neon-tetra', SIZE, WIDTH, HEIGHT);
    const b = { ...createAgent('neon-tetra', SIZE, WIDTH, HEIGHT), id: 'neon-tetra-2', rng: 99 };
    a.x = 70;
    a.y = 200;
    a.heading = 0;
    b.x = 250;
    b.y = 320;
    b.heading = Math.PI;

    const before = Math.hypot(a.x - b.x, a.y - b.y);
    run([a, b], 6);
    const after = Math.hypot(a.x - b.x, a.y - b.y);

    expect(after).toBeLessThan(before);
  });

  it('does not school creatures from different groups', () => {
    const tetra = createAgent('neon-tetra', SIZE, WIDTH, HEIGHT);
    const guppy = createAgent('guppy', SIZE, WIDTH, HEIGHT);

    expect(tetra.profile.school).not.toBe(guppy.profile.school);
    expect(createAgent('goldfish', SIZE, WIDTH, HEIGHT).profile.school).toBe('');
  });
});

describe('depth preference', () => {
  it('settles a shrimp near the floor and a tetra near the surface', () => {
    const shrimp = createAgent('shrimp', SIZE, WIDTH, HEIGHT);
    const tetra = createAgent('neon-tetra', SIZE, WIDTH, HEIGHT);
    shrimp.y = HEIGHT / 2;
    tetra.y = HEIGHT / 2;

    run([shrimp], 20);
    run([tetra], 20);

    expect(shrimp.y).toBeGreaterThan(HEIGHT * 0.6);
    expect(tetra.y).toBeLessThan(HEIGHT * 0.5);
  });
});

describe('facing', () => {
  it('eases the mirror rather than snapping it', () => {
    const agent = createAgent('clownfish', SIZE, WIDTH, HEIGHT);
    agent.flip = 1;
    agent.heading = Math.PI; // now heading left, so the target flip is -1

    stepAgents([agent], WIDTH, HEIGHT, DT);

    expect(agent.flip).toBeLessThan(1);
    expect(agent.flip).toBeGreaterThan(-1);
  });

  it('never mirrors a radially symmetric creature', () => {
    const jellyfish = createAgent('jellyfish', SIZE, WIDTH, HEIGHT);
    jellyfish.heading = Math.PI;

    run([jellyfish], 5);

    expect(jellyfish.flip).toBe(1);
    expect(jellyfish.pitch).toBe(0);
  });
});

describe('reproducibility', () => {
  it('produces identical runs from identical seeds', () => {
    const first = createAgents(['clownfish', 'guppy'], SIZE, WIDTH, HEIGHT);
    const second = createAgents(['clownfish', 'guppy'], SIZE, WIDTH, HEIGHT);

    run(first, 5);
    run(second, 5);

    expect(first[0].x).toBe(second[0].x);
    expect(first[1].y).toBe(second[1].y);
  });

  it('does not stack every creature in the same starting spot', () => {
    const agents = createAgents(['clownfish', 'guppy', 'goldfish'], SIZE, WIDTH, HEIGHT);

    const xs = agents.map((agent) => agent.x);
    expect(new Set(xs).size).toBe(xs.length);
  });
});

describe('reconcileAgents', () => {
  it('reuses an existing agent in place rather than recreating it', () => {
    const existing = createAgents(['clownfish', 'guppy'], SIZE, WIDTH, HEIGHT);
    run(existing, 3); // move them away from their spawn position

    const reconciled = reconcileAgents(existing, ['clownfish', 'guppy'], SIZE, WIDTH, HEIGHT);

    expect(reconciled[0]).toBe(existing[0]);
    expect(reconciled[1]).toBe(existing[1]);
  });

  it('adds a new agent for a newly-added id without resetting the others', () => {
    const existing = createAgents(['clownfish'], SIZE, WIDTH, HEIGHT);
    run(existing, 3);
    const movedX = existing[0].x;
    const movedY = existing[0].y;

    const reconciled = reconcileAgents(existing, ['clownfish', 'guppy'], SIZE, WIDTH, HEIGHT);

    expect(reconciled).toHaveLength(2);
    expect(reconciled[0]).toBe(existing[0]);
    expect(reconciled[0].x).toBe(movedX);
    expect(reconciled[0].y).toBe(movedY);
    expect(reconciled[1].id).toBe('guppy');
  });

  it('drops agents whose id is no longer present', () => {
    const existing = createAgents(['clownfish', 'guppy'], SIZE, WIDTH, HEIGHT);

    const reconciled = reconcileAgents(existing, ['guppy'], SIZE, WIDTH, HEIGHT);

    expect(reconciled).toHaveLength(1);
    expect(reconciled[0]).toBe(existing[1]);
  });
});
