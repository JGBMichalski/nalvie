# Nalvie
Open-source pomodoro/focus app for mobile. Grow a personal aquarium by staying off your phone — no accounts, no ads, no cloud.

## Project structure

This is a [pnpm workspaces](https://pnpm.io/workspaces) + [Turborepo](https://turborepo.com/) monorepo:

- `apps/mobile` — the Expo/React Native app.
- `packages/core` — platform-agnostic session logic, storage interfaces, and stats calculations shared across all platforms.

## Getting started

```sh
pnpm install
pnpm --filter @nalvie/mobile dev
```

Run everything (build, lint, typecheck, test) across the monorepo:

```sh
pnpm turbo run build lint typecheck test
```

See [`CONTRIBUTING.md`](./CONTRIBUTING.md) for more details.

## Credits

Streaming powered by [SomaFM](https://somafm.com) — the optional in-session radio mode streams their internet radio stations, freely relayable per their [developer terms](https://somafm.com/developer/).

## License

AGPL-3.0-only. See [`LICENSE`](./LICENSE).

