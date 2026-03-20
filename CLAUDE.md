# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run start          # Start Expo dev server
npm run ios            # Run on iOS simulator
npm run android        # Run on Android emulator
npm run test           # Run Jest tests
npm run test:watch     # Jest watch mode
npx expo run:ios -d    # Build and run on physical iOS device
```

## Architecture

**React Native/Expo habit tracker** with neo-brutalism design, SQLite persistence, and Zustand state management.

### Boot Sequence
`useBootLoader` hook → open SQLite DB → create tables (idempotent) → run migrations → hydrate Zustand store → hide splash → render app. Database singleton accessed via `getDatabase()` after boot.

### Data Flow
All mutations follow: **write to SQLite first → update Zustand on success**. SQLite is source of truth. If DB throws, store stays unchanged.

### Key Directories
- `app/` — Expo Router file-based routing (tabs: Habits, Calendar, Settings; modals: habit/new; screens: habit/[id])
- `src/db/` — SQLite schema, queries, migrations. `DatabaseLike` interface enables DI for testing
- `src/store/` — Zustand store (`habitStore.ts`) + derived selectors (`selectors.ts`)
- `src/utils/` — Pure functions: dates (date-fns wrappers), streak calculation, UUID generation
- `src/components/` — UI components (HabitCard, CalendarHeatmap, ProgressRing, etc.)
- `src/constants/` — Theme (`neo` object), color palette (12 habit colors), icon mappings
- `__tests__/` — Mirrors src structure; `helpers/mockDatabase.ts` provides mock `DatabaseLike`

### Domain Model
- **Habit** — name, color, icon, frequency (discriminated union: `{type:'daily'}` | `{type:'weekly', days:number[]}`), createdAt, position
- **Completions** — stored as `Record<habitId, Set<dateStr>>` in store for O(1) lookup
- **Freezes** — streak freeze (1 per 7-day rolling window per habit), auto-applied on gap
- **Streaks** — always computed, never stored. Walk backward from today counting scheduled+completed days

### Day/Date Conventions
- All dates are `YYYY-MM-DD` strings in device local timezone
- Day numbering: `date-fns getDay()` — 0=Sun, 1=Mon, ..., 6=Sat
- Weekly frequency UI shows M T W T F S S mapped to `[1,2,3,4,5,6,0]`
- Habits only appear on dates >= their `createdAt.slice(0, 10)`
- Future dates are disabled (not navigable) in both Today view and Calendar

### Design System (Neo-Brutalism)
- 2px borders, 3x3 solid offset shadows, pastel backgrounds, 700-800 font weights
- Border radius: 16px (cards), 12px (small), 20px (large), 999px (pills)
- Light mode only (forced via `useColorScheme` hook always returning `'light'`)
- Theme constants in `src/constants/theme.ts`, navigation theme in `app/_layout.tsx`

### Hard Limits
- 15 habits max (enforced in store). Keeps notifications under iOS 64-notification cap.

## Testing

Tests use `createMockDatabase()` from `__tests__/helpers/mockDatabase.ts` which implements `DatabaseLike` with jest mocks. Three categories:
- **DB tests** — verify SQL queries and mutations
- **Store tests** — mock DB, verify Zustand updates (and no-update on error)
- **Utility tests** — pure function tests for streak calculation and date logic

## Path Alias

`@/*` maps to project root (`./`). Example: `import { useHabitStore } from '@/src/store/habitStore'`
