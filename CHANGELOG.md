# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/), and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added

- A session now has an "End session" button in the top-right corner, with a confirmation prompt.
- The fish picker now has a "Random" option that selects one of your unlocked fish at random.
- The selected fish now grows across a running session. It starts as a small egg that hatches into a tiny fish and grows to its full tank size by the time the timer reaches zero.
- The lock screen now shows a live countdown for an in-progress session instead of a fixed "25 min session" label.
- A short completion chime plays the moment a session's timer reaches zero, on both platforms, whether the screen is locked or not.

### Fixed

- Ambient sound now stops the moment a session's timer reaches zero, and the session's lock-screen display is cleared.
- The "your tank grew" notification now arrives exactly when the session ends.

### Changed

- An in-progress session is now native code.
- Audio at session end is now a hard stop followed by the completion chime.

## [0.1.3] - 2026-09-01

### Added

- Points economy: completed sessions now earn points (10/minute of planned duration), and fish are unlocked permanently by spending points in the fish picker (common 150 / uncommon 500 / rare 1500). New players start with clownfish and guppy already unlocked. The Home screen's overlay now shows the running points balance, and onboarding has a new slide explaining the earn-then-spend loop.
- "Clear tank" (Settings screen): deletes every tank item after a confirmation prompt. Cleared fish stay permanently unlocked and can only reappear by completing another session with them selected.
- Swappable tank themes: seven tank background looks (Reef, Twilight, Kelp Forest, Abyss, Tropical Shallows, Lagoon, Sunrise).

### Changed

- `Settings` gained `pointsBalance`; a new permanent `unlockedSpecies` ledger tracks which species have been purchased.
- `Settings` gained `tankThemeId`, and `core` now exposes the tank-theme palettes as plain data (`TANK_THEMES`).
- The Home/Tank screen's overlay now shows only the points balance; the streak and item-count summaries moved to the Stats screen (which also gained an "Items in tank" count) instead of showing on Home.

### Removed

- The System/Light/Dark theme toggle (Settings screen).

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

