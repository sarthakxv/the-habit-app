# Habit Tracker App - Implementation Plan

## Overview

A daily habit tracking app built with Expo (React Native). The core loop: define habits, get reminded, mark them done, watch streaks grow. Designed to be fun and sticky, not complex.

Hard constraint: maximum 15 habits. This keeps the app focused, notifications manageable, and the UI clean.

---

## Tech Stack

- **Framework**: Expo SDK 52+ (managed workflow)
- **Navigation**: expo-router (file-based routing)
- **Local DB**: expo-sqlite (structured queries, better than AsyncStorage for relational data)
- **State Management**: zustand (lightweight, no boilerplate)
- **Notifications**: expo-notifications (local scheduling, deep linking)
- **Date Handling**: date-fns
- **Animations**: react-native-reanimated + react-native-gesture-handler
- **Haptics**: expo-haptics
- **Splash/Boot**: expo-splash-screen

---

## V1 - Core App

This is the MVP. Ship this first, use it daily, then iterate.

### Data Model (SQLite)

```sql
-- Schema version tracking for migrations
CREATE TABLE schema_version (
  version INTEGER NOT NULL         -- incremented with each migration
);
INSERT INTO schema_version (version) VALUES (1);

CREATE TABLE habits (
  id TEXT PRIMARY KEY,            -- uuid via expo-crypto randomUUID()
  name TEXT NOT NULL,
  color TEXT NOT NULL,            -- hex color, e.g. "#4CAF50"
  icon TEXT NOT NULL,             -- emoji or icon name
  frequency TEXT NOT NULL,        -- JSON: {"type":"daily"} or {"type":"weekly","days":[1,3,5]}
  reminder_time TEXT,             -- nullable, HH:mm format (24h)
  notification_id TEXT,           -- expo notification identifier, for cancel/reschedule
  position INTEGER NOT NULL,      -- for manual ordering in the list
  created_at TEXT NOT NULL,       -- ISO timestamp
  archived INTEGER DEFAULT 0      -- 0 = active, 1 = soft-deleted
);

CREATE TABLE completions (
  id TEXT PRIMARY KEY,            -- uuid via expo-crypto randomUUID()
  habit_id TEXT NOT NULL,
  completed_at TEXT NOT NULL,     -- date string YYYY-MM-DD
  FOREIGN KEY (habit_id) REFERENCES habits(id) ON DELETE CASCADE,
  UNIQUE(habit_id, completed_at)
);

CREATE TABLE streak_freezes (
  id TEXT PRIMARY KEY,            -- uuid via expo-crypto randomUUID()
  habit_id TEXT NOT NULL,
  freeze_date TEXT NOT NULL,      -- YYYY-MM-DD, the missed day that was forgiven
  created_at TEXT NOT NULL,       -- ISO timestamp of when freeze was auto-applied
  FOREIGN KEY (habit_id) REFERENCES habits(id) ON DELETE CASCADE,
  UNIQUE(habit_id, freeze_date)
);
```

Key decisions:
- Streaks are COMPUTED from completions + streak_freezes, never stored. This avoids sync/corruption issues.
- Completion is binary per day. No partial completions.
- Soft delete via `archived` flag. Archived habits keep their completion history.
- `position` field enables drag-to-reorder.
- `notification_id` stores the expo notification identifier so we can cancel/reschedule per habit.
- UUIDs generated via `expo-crypto` `randomUUID()` — no additional uuid library needed.
- Schema versioned from day one via `schema_version` table. Migrations run on boot if `version < LATEST`.

### State Management (Zustand)

```
Store shape:
  habits: Habit[]                              -- all active (non-archived) habits
  completions: Record<habitId, Set<dateString>> -- ALL completions (not just today), needed for streak calc
  freezes: Record<habitId, Set<dateString>>    -- streak freeze dates per habit

Actions:
  loadFromDB()                  -- called on app boot, hydrates store from SQLite (all habits, all completions, all freezes)
  addHabit(habit)               -- insert into DB + store, enforce 15 cap
  updateHabit(id, updates)      -- update DB + store, reschedule notification if reminder changed
  archiveHabit(id)              -- set archived=1, cancel notification, remove from store
  deleteHabitPermanently(id)    -- hard delete from DB (for archived habits only)
  toggleCompletion(habitId, date) -- insert or delete completion row, update store
  reorderHabits(orderedIds)     -- update position values in DB + store (batched in a transaction)

Computed (derived, not stored):
  getCurrentStreak(habitId)     -- count consecutive days backward from today, treating freeze days as completed
  getLongestStreak(habitId)     -- scan all completions + freezes for max consecutive run
  getTodayProgress()            -- count of today's completions / today's applicable habits
  isCompletedToday(habitId)     -- check if habitId has completion for today's date
  getAvailableFreezes(habitId)  -- 1 minus count of freezes in the last 7 rolling days (0 or 1)
```

Pattern: zustand store is the in-memory cache. Every mutation writes through to SQLite first, then updates the store on success. If the DB write throws, the store is not updated — this keeps them consistent. SQLite is the source of truth. On app start, `loadFromDB()` hydrates everything.

Note: `completions` uses `Set<dateString>` in-memory which doesn't serialize to JSON natively. This is fine since we hydrate manually from SQLite (no zustand persist middleware). Add a code comment noting this if persist is ever added.

### Navigation Structure (expo-router)

```
app/
  _layout.tsx                -- Root layout, notification listeners, boot logic
  (tabs)/
    _layout.tsx              -- Tab bar layout
    index.tsx                -- Today view (main screen, default tab)
    calendar.tsx             -- Calendar heatmap view
    settings.tsx             -- Settings, notification prefs, export
  habit/
    new.tsx                  -- Create new habit (presented as modal)
    [id].tsx                 -- Habit detail: mark done, streak info, edit, history, delete
```

### Screens

#### Boot Screen
- expo-splash-screen keeps the native splash visible during JS bundle load
- Once JS is running, show a custom boot screen component with an animated progress bar
- Boot sequence: initialize SQLite -> run pending migrations -> load habits -> load ALL completions + freezes -> hydrate zustand store
- Once hydrated, fade transition to Today view
- This will be fast (<500ms typically) but prevents any flash of empty content

#### Today View (index.tsx) - The Main Screen
This is the screen users see 95% of the time. It must be fast and satisfying.

Layout (top to bottom):
1. **Date header**: Today's date, prominent. Left/right arrows or horizontal swipe to view previous days.
2. **Progress indicator**: Circular ring or horizontal bar showing "4/6 done today". Animates as you complete habits.
3. **Habit list**: Scrollable list of today's applicable habits (filtered by frequency/day-of-week).
   - Each habit card shows: color dot/stripe, icon, habit name, current streak ("Day 14"), tap-to-complete area
   - Completed habits: checkmark animation, dim in place with strikethrough + subtle opacity reduction (do NOT move to bottom — shifting list positions mid-interaction causes misclicks)
   - One-tap to complete. Tap again to undo. Zero friction. No confirmation dialogs.
4. **Add button**: FAB or "+" in header. If at 15 habits, show a toast: "Delete a habit to add a new one."
5. **"All done" state**: When 100% complete for the day, show a celebratory animation (confetti burst, color pulse, or similar). This is the dopamine hit that keeps people coming back.

#### Calendar View (calendar.tsx)
- Monthly calendar grid, GitHub-contributions style heatmap
- Each day cell colored by completion percentage: 0% = empty/gray, partial = light shade of accent color, 100% = full accent color
- Tapping a day shows a mini-summary of which habits were completed/missed
- Swipe or arrows to navigate months
- Seeing a wall of filled-in days is inherently motivating

#### Habit Detail Screen (habit/[id].tsx)
This is where notifications deep-link to.

Layout:
1. **Big "Mark Done" button**: The primary action. Large, prominent, satisfying press animation with haptic feedback (expo-haptics). If already done today, show "Done" state with undo option.
2. **Streak display**: Current streak (large number), longest streak (smaller, secondary)
3. **Mini calendar**: Last 30 days as a row of dots/squares showing completion history
4. **Edit button**: Opens inline edit or edit modal for name, color, icon, frequency, reminder time
5. **Delete/Archive button**: Bottom of screen, requires confirmation. Cancels notification.

#### Create Habit Screen (habit/new.tsx)
Modal presentation.

Fields:
- Name (text input, required)
- Icon (emoji picker or predefined icon grid)
- Color (predefined palette of 8-12 colors, tap to select)
- Frequency: "Every day" (default), "Specific days" (show day-of-week toggles: M T W T F S S)
- Reminder time (optional): Time picker. If set, schedule local notification.

Enforce 15 habit cap here. If user already has 15 active habits, don't show this screen. Show a bottom sheet or alert: "You've hit the 15 habit limit. Archive or delete an existing habit to make room."

#### Settings Screen (settings.tsx)
- Global notification toggle (master on/off)
- Default reminder time (applied to new habits, doesn't change existing ones)
- Export data as JSON (V1) and CSV (V2)
- App info / version
- "Manage archived habits" (view and permanently delete or restore)

### Notifications Architecture

#### Scheduling
When a habit is created or edited with a `reminder_time`:
```
const notificationId = await Notifications.scheduleNotificationAsync({
  content: {
    title: habitName,
    body: `Time to check in!`,  // generic body for V1 — streak count would go stale in repeating notifications
    data: { habitId: habit.id, screen: 'habit-detail' },
    sound: true,
  },
  trigger: {
    type: 'daily',
    hour: parseInt(reminder_time.split(':')[0]),
    minute: parseInt(reminder_time.split(':')[1]),
    repeats: true,
  },
});
// Store notificationId in the habit record
```

Note: V1 uses a generic notification body ("Time to check in!") because repeating notifications can't dynamically update the streak count. A stale "Keep your 5-day streak alive!" when the streak is actually 47 erodes trust. In V2, background tasks will reschedule notifications nightly with accurate streak counts.

#### Deep Linking on Notification Tap
In the root `_layout.tsx`:
```
// Handle notification tap when app is in background/killed
Notifications.addNotificationResponseReceivedListener((response) => {
  const habitId = response.notification.request.content.data?.habitId;
  if (habitId) {
    router.push(`/habit/${habitId}`);
  }
});

// Also handle the case where app was launched from a notification
// (check Notifications.getLastNotificationResponseAsync() on boot)
```

The flow: notification fires -> user taps -> app opens/foregrounds -> navigates to `/habit/[id]` -> user taps "Mark Done" -> done. Two taps from lock screen to completion.

#### Lifecycle Management
- On habit create with reminder: schedule notification, store `notification_id`
- On habit edit (reminder time changed): cancel old notification by `notification_id`, schedule new one, update stored id
- On habit edit (reminder removed): cancel notification, set `notification_id` to null
- On habit archive/delete: cancel notification by `notification_id`
- Permission request: trigger on first habit creation with a reminder time, not on app launch. Better conversion rate.

#### 15 Habit Cap and Notifications
With max 15 habits, each with one daily notification, you'll never exceed 15 scheduled notifications. iOS limit is 64. Android has no practical limit. This is a non-issue.

### UX Principles for V1

1. **One-tap completion**: The core interaction must be instant. No confirmation, no animation that blocks input. Tap -> done.
2. **Streaks are king**: Show streak count prominently on every habit card. Streak anxiety is the primary retention mechanic.
3. **Streak freeze**: Each habit gets ONE free pass per rolling 7-day window. This prevents the "I missed one day, I give up" spiral that kills every habit tracker. This is the single most important retention feature.

   **Streak freeze rules:**
   - A freeze is **auto-consumed** when `getCurrentStreak()` detects a missed day while scanning backward from today. If a freeze is available (no freeze used in the last 7 rolling days for that habit), a row is inserted into `streak_freezes` and the streak continues unbroken.
   - **Rolling 7-day window**: Count freezes for this habit where `freeze_date >= today - 6 days`. If count is 0, a freeze is available. This means one freeze per habit per week, rolling daily.
   - **Streak calculation with freezes**: When scanning backward from today, treat a day with a freeze record the same as a completed day — the streak continues through it.
   - **Visual indicator**: Show a shield/crack icon on the streak badge when the current streak includes a freeze. On the mini-calendar, freeze days get a distinct visual (e.g., dashed border instead of solid fill).
   - **Weekly habits**: For habits with `{"type":"weekly","days":[1,3,5]}`, freezes only apply to scheduled days. Missing Tuesday when you're only scheduled for Mon/Wed/Fri doesn't consume a freeze.
   - The freeze is **not user-activated** — it fires automatically. This is intentional: requiring manual activation adds friction and users forget, defeating the purpose.
4. **Satisfying feedback**: Haptic bump on completion (expo-haptics medium impact). Checkmark animation. Progress bar filling up. These small things compound.
5. **No onboarding flow**: The app should be obvious. First launch -> empty state with a clear "Add your first habit" prompt. That's it.
6. **Dark mode support from day 1**: Use a theme context. Design with both modes in mind. Don't bolt it on later.

### Conventions

**Day numbering**: Use `date-fns` `getDay()` which returns 0=Sunday, 1=Monday, ..., 6=Saturday. The `frequency.days` array in the JSON uses these same numbers. The UI displays "M T W T F S S" but maps to `[1,2,3,4,5,6,0]` internally. Document this mapping in `src/utils/dates.ts`.

**Timezone**: All date strings (`YYYY-MM-DD`) are derived from the device's local timezone. Use `date-fns` `format(new Date(), 'yyyy-MM-dd')` for "today". Never use UTC for user-facing date logic — a user completing a habit at 11pm should see it count for today, not tomorrow.

**TypeScript**: Strict mode enabled (`"strict": true` in tsconfig). No `any` types.

**Error handling (V1)**: Write to DB first, update store on success. If DB write throws, surface a toast to the user ("Something went wrong, try again") and do not update the store. No silent failures.

**Notification permission denied**: If the user denies notification permission, show a non-blocking banner on the create/edit habit screen: "Notifications are off. Enable in Settings to get reminders." Don't block habit creation — reminders are optional.

### File/Folder Structure

```
habit-tracker/
  app/
    _layout.tsx                   -- Root layout: splash screen management, notification setup, theme provider, zustand hydration
    (tabs)/
      _layout.tsx                 -- Tab navigator config (Today, Calendar, Settings)
      index.tsx                   -- Today view
      calendar.tsx                -- Calendar heatmap
      settings.tsx                -- Settings
    habit/
      new.tsx                     -- Create habit modal
      [id].tsx                    -- Habit detail/edit

  src/
    db/
      schema.ts                  -- SQL table creation statements
      migrations.ts              -- Version-based schema migrations, runs on boot if version < LATEST
      database.ts                -- SQLite initialization, query helpers (getHabits, insertHabit, insertCompletion, etc.)

    store/
      habitStore.ts              -- Zustand store: state + actions
      selectors.ts               -- Derived computations (streaks, progress, etc.)

    services/
      notificationService.ts     -- Schedule, cancel, reschedule notifications. Permission handling. Deep link setup.

    utils/
      dates.ts                   -- Date helpers using date-fns (getToday, formatDate, getDayOfWeek, getDateRange)
      streak.ts                  -- Streak calculation logic (getCurrentStreak, getLongestStreak, hasStreakFreeze)
      uuid.ts                    -- UUID generation via expo-crypto randomUUID()

    constants/
      colors.ts                  -- Color palette for habit colors
      icons.ts                   -- Available icons/emojis for habits
      theme.ts                   -- Light/dark theme definitions

    components/
      HabitCard.tsx              -- Habit list item for Today view
      ProgressRing.tsx           -- Circular progress indicator
      CalendarHeatmap.tsx        -- Monthly heatmap grid
      CompletionAnimation.tsx    -- Check/confetti animation on complete
      StreakBadge.tsx            -- Streak counter display
      DaySelector.tsx            -- Day-of-week toggle for frequency selection
      TimePicker.tsx             -- Reminder time picker
      ColorPicker.tsx            -- Habit color selection grid
      IconPicker.tsx             -- Habit icon/emoji selector
      EmptyState.tsx             -- "Add your first habit" prompt
      BootScreen.tsx             -- Loading screen with progress indicator
      PerfectDayBanner.tsx       -- Celebration when all habits done

    hooks/
      useHabits.ts               -- Convenience hook wrapping zustand selectors
      useNotifications.ts        -- Notification permission + listener setup
      useBootLoader.ts           -- Boot sequence (init DB, hydrate store, resolve splash)
```

---

## V2 - Polish and Depth

Build these after V1 is stable and you've been using it daily for at least a week. Real usage will tell you what's missing.

### Features

1. **Stats dashboard** (new tab or section in settings):
   - Completion rate per habit over 7 / 30 / 90 days (bar chart or simple percentage)
   - Best streaks leaderboard (your habits ranked by longest streak)
   - Weekly trend: are you getting better or worse?
   - Use a charting lib like `react-native-chart-kit` or `victory-native`

2. **Habit categories/tags**: Group habits (e.g., Health, Work, Learning). Filter Today view by category. Simple text tags, not a complex taxonomy.

3. **Flexible scheduling**: "3 times per week" mode where it doesn't matter which days. Completion goal tracked against a weekly target rather than specific days. Update frequency JSON schema:
   ```json
   {"type": "x_per_week", "target": 3}
   ```

4. **Dynamic notification body**: Background task (expo-background-fetch or expo-task-manager) that runs nightly to reschedule notifications with updated streak counts in the body text.

5. **Data export**: Export all habits + completions as JSON and CSV. Use expo-file-system + expo-sharing.

6. **Haptic feedback polish**: Different haptic patterns for different actions. Medium impact for completion, light for undo, success notification for "perfect day."

7. **Drag-to-reorder habits**: Use react-native-gesture-handler + reanimated for smooth drag-and-drop reordering on the Today view. Update `position` field in DB.

8. **Improved animations**:
   - Smooth check/uncheck transitions
   - Staggered list entry animation
   - Progress ring smooth fill animation
   - Confetti/particle burst on perfect day

9. **Accessibility**: VoiceOver/TalkBack labels on all interactive elements. Sufficient color contrast. Reduced motion preference support.

### Architecture Changes for V2

- Add a `categories` table if tags become complex, or keep it as a JSON array field on habits for simplicity
- Add expo-task-manager dependency for background notification updates
- Schema migrations already in place from V1 — just add new migration entries to `src/db/migrations.ts`

---

## V3 - Cloud Sync and Advanced

Only build this when V1 and V2 are solid and you genuinely need multi-device support or want to learn cloud sync.

### Features

1. **Cloud sync via Supabase**:
   - Auth: Supabase Auth (email/password or magic link)
   - Replicate habits and completions tables to Supabase Postgres
   - Sync strategy: last-write-wins for simplicity, with `updated_at` timestamps on every row
   - Conflict resolution: if same habit is edited on two devices, most recent `updated_at` wins
   - Offline-first: always write to local SQLite, sync to Supabase when online
   - Use Supabase real-time subscriptions for instant sync when both devices are online

2. **Habit templates**: Pre-built habit sets (e.g., "Morning Routine": wake up early, meditate, exercise, journal). User can import a template that creates multiple habits at once. Store templates as JSON, either bundled in the app or fetched from Supabase.

3. **Per-habit journaling**: Optional short text note per completion. Add a `note` TEXT column to the completions table. On the habit detail screen, show a small text input after marking done: "How did it go?" (optional, skippable). View past notes in the habit history.

4. **Timer for time-based habits**: Built-in countdown/Pomodoro timer for habits like "Meditate for 10 min" or "Read for 30 min". Timer completion auto-marks the habit as done. Uses expo-notifications for timer-done alert if app is backgrounded.

5. **Widget support**: When Expo supports home screen widgets (or via a custom native module / expo config plugin), show today's progress on the home screen. This is platform-dependent and may require ejecting from managed workflow.

6. **Share streaks / accountability**: Generate a shareable image of your streak/stats (react-native-view-shot to capture a component as an image, then expo-sharing). Not full social features, just "share to Instagram story" type export.

### Architecture Changes for V3

- Add Supabase client library (@supabase/supabase-js)
- Add `updated_at` and `synced_at` columns to both tables for sync tracking
- Add a `sync_queue` table or in-memory queue for offline mutations that need to be pushed
- Auth context wrapping the app
- Network state listener (NetInfo) to trigger sync when coming online
- The sync logic is the hard part here. Start with a simple "push all unsynced, pull all newer" approach before optimizing.

### Supabase Schema (mirrors local with sync fields)

```sql
-- Supabase (remote)
CREATE TABLE habits (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES auth.users NOT NULL,
  name TEXT NOT NULL,
  color TEXT NOT NULL,
  icon TEXT NOT NULL,
  frequency JSONB NOT NULL,
  reminder_time TEXT,
  position INTEGER NOT NULL,
  created_at TIMESTAMPTZ NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL,
  archived BOOLEAN DEFAULT FALSE
);

CREATE TABLE completions (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES auth.users NOT NULL,
  habit_id UUID REFERENCES habits(id) ON DELETE CASCADE,
  completed_at DATE NOT NULL,
  note TEXT,
  created_at TIMESTAMPTZ NOT NULL,
  UNIQUE(habit_id, completed_at)
);

-- RLS policies: users can only read/write their own data
ALTER TABLE habits ENABLE ROW LEVEL SECURITY;
ALTER TABLE completions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own habits" ON habits
  FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users manage own completions" ON completions
  FOR ALL USING (auth.uid() = user_id);
```

---

## Implementation Order

This is the build sequence. Each step should result in something testable.

### V1 Build Steps

1. **Project setup**: Initialize Expo project, install dependencies (expo-router, expo-sqlite, zustand, date-fns, expo-notifications, expo-haptics, expo-splash-screen, react-native-reanimated, react-native-gesture-handler, expo-crypto). Configure expo-router file structure. Set up TypeScript with strict mode. Configure `app.json` / `app.config.ts` (bundle identifier, notification permissions, splash screen config, Android notification channel).

2. **Database layer**: Implement `src/db/schema.ts`, `src/db/migrations.ts`, and `src/db/database.ts`. Create tables on first launch including `schema_version`, `habits`, `completions`, and `streak_freezes`. Implement version-based migration runner. Write and test all query functions: `getHabits()`, `getAllCompletions()`, `getStreakFreezes()`, `insertHabit()`, `insertCompletion()`, `deleteCompletion()`, `updateHabit()`, `archiveHabit()`, `insertStreakFreeze()`.

3. **Zustand store**: Implement `src/store/habitStore.ts`. Wire up all actions to DB functions with DB-first-then-store pattern (never update store if DB write fails). Write streak calculation in `src/utils/streak.ts` including freeze-aware logic. Write date helpers in `src/utils/dates.ts` with day numbering convention documented. **Unit test `streak.ts` and `dates.ts`** — these are the most bug-prone modules (streak with freezes, day-of-week edge cases, timezone boundaries). Test the full CRUD cycle: add habit, toggle completion, verify streak computation with and without freezes.

4. **Boot sequence**: Implement `useBootLoader` hook. Manage expo-splash-screen hide timing. Show custom BootScreen component with progress animation while DB initializes and store hydrates. Transition to main app.

5. **Today view**: Build the main screen. Habit list with HabitCard components. Progress indicator at top. Date header with navigation. Empty state for first launch. Enforce 15 habit cap in UI.

6. **Create/Edit habit**: Build the new habit modal and edit flow. Color picker, icon picker, frequency selector (daily / specific days), optional reminder time picker. Validate inputs. Save to DB + store.

7. **Habit detail screen**: Mark done button (primary action), streak display, mini completion history, edit and delete functionality. This is where notification deep links land.

8. **Completion animations and haptics**: Add reanimated animations for check/uncheck. Haptic feedback on completion. Progress ring animation. Perfect day celebration.

9. **Calendar heatmap view**: Monthly grid colored by daily completion percentage. Month navigation. Tap day for summary.

10. **Notifications**: Implement `src/services/notificationService.ts`. Permission request flow. Schedule/cancel/reschedule per habit. Deep link handling in root layout. Notification tap -> navigate to habit detail.

11. **Settings screen**: Global notification toggle, archived habits management, data export (JSON), dark/light theme toggle.

12. **Dark mode**: Theme context with light/dark definitions. Apply throughout all screens. Respect system preference by default with manual override.

13. **Testing and polish**: Use the app daily. Fix bugs. Tune animations. Adjust timing and layouts. Make sure it feels good on both iOS and Android.

### V2 Build Steps (after V1 is stable)

14. Stats dashboard
15. Categories/tags
16. Flexible scheduling ("x per week")
17. Dynamic notification bodies via background task
18. CSV export
19. Drag-to-reorder
20. Accessibility pass

### V3 Build Steps (when needed)

21. Supabase setup (project, schema, RLS policies)
22. Auth flow (sign up, sign in, sign out)
23. Sync engine (push/pull, conflict resolution)
24. Offline queue
25. Per-habit journaling
26. Timer feature
27. Share/export streaks as images

---

## Key Dependencies

```json
{
  "expo": "~52.x",
  "expo-router": "~4.x",
  "expo-sqlite": "~15.x",
  "expo-notifications": "~0.29.x",
  "expo-haptics": "~14.x",
  "expo-splash-screen": "~0.29.x",
  "expo-crypto": "~14.x",
  "expo-file-system": "~18.x",
  "expo-sharing": "~13.x",
  "zustand": "^5.x",
  "date-fns": "^4.x",
  "react-native-reanimated": "~3.x",
  "react-native-gesture-handler": "~2.x"
}
```

Note: Pin to exact Expo SDK-compatible versions. Run `npx expo install <package>` to get the right versions.

---

## Design Notes

- **Color palette**: Pick 10-12 distinct, vibrant colors for habits. They should look good on both light and dark backgrounds. Consider using a curated set rather than a full color picker.
- **Typography**: Use system fonts (San Francisco on iOS, Roboto on Android) via the default React Native text. No custom fonts needed for V1.
- **Iconography**: Start with emoji for habit icons. It's cross-platform, requires zero asset management, and users understand it immediately. Can add a proper icon set (lucide-react-native or similar) in V2 if needed.
- **Spacing/sizing**: Use a consistent 4px/8px grid. Touch targets minimum 44x44 points. Habit cards should be generously sized for easy tapping.
- **Streak freeze visual**: Fully specced in UX Principles section. Shield icon on streak badge when freeze is active, dashed border on freeze days in calendar views.
