<p align="center">
  <img src="./apps/mobile/assets/icon.png" alt="Nalvie app icon" width="96" height="96">
</p>

<h1 align="center">Nalvie</h1>
<p align="center">Open-source pomodoro/focus app for mobile. Grow a personal aquarium by staying off your phone — no accounts, no ads, no cloud.</p>

<p align="center">
  <a href="https://github.com/JGBMichalski/nalvie/actions/workflows/ci.yml"><img src="https://github.com/JGBMichalski/nalvie/actions/workflows/ci.yml/badge.svg" alt="CI status"></a>
  <a href="https://github.com/JGBMichalski/nalvie/releases/latest"><img src="https://img.shields.io/github/v/release/JGBMichalski/nalvie" alt="Latest release"></a>
  <a href="./LICENSE"><img src="https://img.shields.io/github/license/JGBMichalski/nalvie" alt="License"></a>
</p>

> **Status:** early/beta. Runs on both iOS and Android via a custom dev client, but CI and release builds currently only cover Android.

## Download

[**Download the latest Android APK**](https://github.com/JGBMichalski/nalvie/releases/latest/download/app-release.apk) — or see [all releases](https://github.com/JGBMichalski/nalvie/releases). No Play Store listing yet; you'll need to allow installs from unknown sources.

## Features

- Focus timer sessions with configurable durations.
- A personal aquarium that grows as you complete focus sessions, with unlockable fish.
- Optional in-session ambient audio, including [SomaFM](https://somafm.com) internet radio stations.
- Session stats and streak tracking.
- Local notifications and lockscreen timer support.
- Background session handling for when the app is closed or the screen is locked.
- Light and dark themes, following the system appearance.

## Project structure

This is a [pnpm workspaces](https://pnpm.io/workspaces) + [Turborepo](https://turborepo.com/) monorepo:

- `apps/mobile` — the Expo/React Native app.
- `packages/core` — platform-agnostic session logic, storage interfaces, and stats calculations shared across all platforms.

## Getting started

```sh
pnpm install
pnpm --filter @nalvie/mobile dev
```

> **Note:** the mobile app requires a custom dev client — see [`CONTRIBUTING.md`](./CONTRIBUTING.md) for the native build step.

Run everything (build, lint, typecheck, test) across the monorepo:

```sh
pnpm turbo run build lint typecheck test
```

See [`CONTRIBUTING.md`](./CONTRIBUTING.md) for more details.

## Credits

Streaming powered by [SomaFM](https://somafm.com) — the optional in-session radio mode streams their internet radio stations, freely relayable per their [developer terms](https://somafm.com/developer/).

## License

AGPL-3.0-only. See [`LICENSE`](./LICENSE).
