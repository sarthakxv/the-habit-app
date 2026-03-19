import { SCHEMA_VERSION } from './schema';

export interface Migration {
  version: number;
  up: (db: DatabaseLike) => Promise<void>;
}

/** Minimal DB interface for migration runner (matches expo-sqlite subset) */
interface DatabaseLike {
  execAsync(sql: string): Promise<void>;
  runAsync(sql: string, params: unknown[]): Promise<{ changes: number; lastInsertRowId: number }>;
  getFirstAsync<T>(sql: string, params: unknown[]): Promise<T | null>;
}

/**
 * Migration list. Each entry runs when upgrading from version-1 to version.
 * Version 1 is the initial schema (created by CREATE_TABLES_SQL).
 * Add new migrations here as the schema evolves.
 */
export const MIGRATIONS: Migration[] = [
  // Example for future use:
  // { version: 2, up: async (db) => { await db.execAsync('ALTER TABLE habits ADD COLUMN ...'); } },
];

/**
 * Run any pending migrations. Called on every app boot after schema creation.
 * Reads current version from schema_version table, runs migrations sequentially.
 */
export async function runMigrations(db: DatabaseLike): Promise<void> {
  const row = await db.getFirstAsync<{ version: number }>(
    'SELECT version FROM schema_version LIMIT 1',
    []
  );

  let currentVersion: number;

  if (row === null) {
    // First launch — insert initial version
    await db.runAsync('INSERT INTO schema_version (version) VALUES (?)', [SCHEMA_VERSION]);
    return; // No migrations needed on fresh install
  } else {
    currentVersion = row.version;
  }

  if (currentVersion >= SCHEMA_VERSION) {
    return; // Already up to date
  }

  // Run pending migrations in order
  const pending = MIGRATIONS.filter((m) => m.version > currentVersion);
  for (const migration of pending) {
    await migration.up(db);
    await db.runAsync('UPDATE schema_version SET version = ?', [migration.version]);
  }
}
