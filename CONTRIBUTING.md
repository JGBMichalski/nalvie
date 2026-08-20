# Contributing to Nalvie

Thanks for your interest in contributing! Nalvie is a solo-friendly, open-source focus timer app, and contributions of all sizes are welcome — bug fixes, new tank creatures, docs, or entirely new features.

## Project structure

This is a pnpm + Turborepo monorepo:

- `packages/core` — platform-agnostic session logic, storage interfaces, and stats calculations. No React Native dependencies live here; this package is shared across platforms.
- `apps/mobile` — the Expo/React Native app.

## Getting started

1. Install [Node](https://nodejs.org/) (see `.nvmrc` for the version) and [pnpm](https://pnpm.io/installation).
2. Install dependencies:

   ```sh
   pnpm install
   ```

3. Run the mobile app:

   ```sh
   pnpm --filter @nalvie/mobile dev
   ```

4. Run everything (build, lint, typecheck, test) across the monorepo:

   ```sh
   pnpm turbo run build lint typecheck test
   ```

## Before opening a PR

- Make sure `pnpm turbo run lint typecheck test` passes.
- Keep `packages/core` free of platform-specific imports (no `react-native`, `expo-*`, or DOM APIs).
- Small, focused PRs are easier to review than large ones — if you're planning something big, consider opening an issue first to discuss the approach.

## Testing

`packages/core` and `apps/mobile` use different test runners, since they test different things:

- **`packages/core`** uses [Vitest](https://vitest.dev/). Tests are plain input/output assertions against pure functions (no rendering, no native modules) — see `packages/core/src/*.test.ts` for examples. Run with `pnpm --filter @nalvie/core test`, or a single file with `pnpm --filter @nalvie/core exec vitest run src/stats.test.ts`.
- **`apps/mobile`** uses [Jest](https://jestjs.io/) via the [`jest-expo`](https://docs.expo.dev/develop/unit-testing/) preset, plus [`@testing-library/react-native`](https://callstack.github.io/react-native-testing-library/) for rendering components and [`expo-router/testing-library`](https://docs.expo.dev/router/reference/testing/) for testing file-based navigation. Tests live under `apps/mobile/__tests__/` (not inside `app/`, which expo-router treats as routes). Run with `pnpm --filter @nalvie/mobile test`, or a single file with `pnpm --filter @nalvie/mobile exec jest __tests__/navigation.test.tsx`.

## Code style

- TypeScript everywhere, `strict` mode on.
- Formatting/linting will be enforced via CI once configured.

## Reporting bugs / requesting features

Please use the issue templates — they help us get the context needed to help quickly.
