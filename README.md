# The Habit App

A daily habit tracker built with Expo (React Native) featuring neo-brutalism design, SQLite persistence, and Zustand state management.

## Features

- One-tap habit completion with haptic feedback
- Streak tracking with auto-applied streak freezes (1 per 7-day rolling window)
- Calendar heatmap view (GitHub-contributions style)
- Daily/weekly frequency scheduling
- 15 habit cap to keep things focused
- Light mode only, neo-brutalism design system

## Tech Stack

Expo SDK 55 &bull; Expo Router &bull; expo-sqlite &bull; Zustand &bull; date-fns &bull; Reanimated

## Getting Started

```bash
npm install
npm run start       # Expo dev server
npm run ios         # iOS simulator
npm run android     # Android emulator
npm run test        # Jest tests
```

## Architecture

- **Data flow**: SQLite (source of truth) → Zustand store. All mutations write to DB first.
- **Routing**: File-based via Expo Router (`app/` directory)
- **Streaks**: Always computed from completions + freezes, never stored.

See [CLAUDE.md](./CLAUDE.md) for detailed architecture docs.
