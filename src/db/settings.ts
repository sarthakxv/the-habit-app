import type { DatabaseLike } from './database';

/** Returns true if the user has already completed the onboarding flow. */
export async function hasSeenOnboarding(db: DatabaseLike): Promise<boolean> {
  const row = await db.getFirstAsync<{ value: string }>(
    "SELECT value FROM settings WHERE key = 'has_seen_onboarding'",
    []
  );
  return row?.value === '1';
}

/** Persists the fact that onboarding has been completed. */
export async function markOnboardingSeen(db: DatabaseLike): Promise<void> {
  await db.runAsync(
    "INSERT OR REPLACE INTO settings (key, value) VALUES ('has_seen_onboarding', ?)",
    ['1']
  );
}
