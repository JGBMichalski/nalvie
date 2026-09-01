# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/), and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.1.3] - 2026-09-01

### Added

- Points economy: completed sessions now earn points (10/minute of planned duration), and fish are unlocked permanently by spending points in the fish picker (common 150 / uncommon 500 / rare 1500). New players start with clownfish and guppy already unlocked. The Home screen's overlay now shows the running points balance, and onboarding has a new slide explaining the earn-then-spend loop.

### Changed

- `Settings` gained `pointsBalance`; a new permanent `unlockedSpecies` ledger tracks which species have been purchased.
- The Home/Tank screen's overlay now shows only the points balance; the streak and item-count summaries moved to the Stats screen (which also gained an "Items in tank" count) instead of showing on Home.

## [0.1.2] - 2026-09-01

### Changed

- Fish now favour a flatter, more east/west swimming path instead of drifting near-vertically. Jellyfish, which drift without facing their travel direction, are unaffected.

## [0.1.1] - 2026-08-30

### Added

- New app icon

## [0.1.0] - 2026-08-30

### Added

- Light theme. The Settings theme toggle (System / Light / Dark) now recolors the whole app live, following the system appearance when set to System.

### Changed

- The GitHub release workflow now attaches the production APK to the release.

## [0.0.1] - 2026-08-29

### Added

- Focus timer sessions with configurable durations.
- Personal aquarium that grows as you complete focus sessions, with unlockable fish.
- Optional in-session ambient audio, including SomaFM internet radio stations.
- Session stats and streak tracking.
- Local notifications and lockscreen timer support.
- Background session handling for when the app is closed or the screen is locked.

