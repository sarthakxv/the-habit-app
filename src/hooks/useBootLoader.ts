import { useEffect, useState } from 'react';
import * as SplashScreen from 'expo-splash-screen';
import * as SQLite from 'expo-sqlite';
import { initializeDatabase, type DatabaseLike } from '../db/database';
import { hasSeenOnboarding } from '../db/settings';
import { useHabitStore } from '../store/habitStore';

/** Singleton database instance, initialized on first boot. */
let dbInstance: DatabaseLike | null = null;

export function getDatabase(): DatabaseLike {
  if (!dbInstance) {
    throw new Error('Database not initialized. Call useBootLoader first.');
  }
  return dbInstance;
}

/**
 * Boot sequence hook. Initializes SQLite, runs migrations,
 * hydrates the zustand store, then hides the splash screen.
 *
 * Returns { isReady, error } so the root layout can decide what to render.
 */
export function useBootLoader() {
  const [isReady, setIsReady] = useState(false);
  const [isFirstLaunch, setIsFirstLaunch] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const loadFromDB = useHabitStore((s) => s.loadFromDB);

  useEffect(() => {
    async function boot() {
      try {
        // 1. Open database
        const db = await SQLite.openDatabaseAsync('habits.db');
        dbInstance = db as unknown as DatabaseLike;

        // 2. Create tables + run migrations
        await initializeDatabase(dbInstance);

        // 3. Check onboarding flag before hydrating store
        const seenOnboarding = await hasSeenOnboarding(dbInstance);
        setIsFirstLaunch(!seenOnboarding);

        // 4. Hydrate zustand store with all data
        await loadFromDB(dbInstance);

        setIsReady(true);
      } catch (e) {
        setError(e instanceof Error ? e : new Error(String(e)));
      } finally {
        // 5. Hide splash screen regardless of success/failure
        await SplashScreen.hideAsync();
      }
    }

    boot();
  }, [loadFromDB]);

  return { isReady, isFirstLaunch, error };
}
