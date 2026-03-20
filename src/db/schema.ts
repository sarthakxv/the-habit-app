/** Current schema version. Bump this when adding a migration. */
export const SCHEMA_VERSION = 1;

/** SQL to create all tables. Uses IF NOT EXISTS for idempotency. */
export const CREATE_TABLES_SQL = `
PRAGMA journal_mode = WAL;
PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS schema_version (
  version INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS habits (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  color TEXT NOT NULL,
  icon TEXT NOT NULL,
  frequency TEXT NOT NULL,
  reminder_time TEXT,
  notification_id TEXT,
  position INTEGER NOT NULL,
  created_at TEXT NOT NULL,
  archived INTEGER DEFAULT 0
);

CREATE TABLE IF NOT EXISTS completions (
  id TEXT PRIMARY KEY,
  habit_id TEXT NOT NULL,
  completed_at TEXT NOT NULL,
  FOREIGN KEY (habit_id) REFERENCES habits(id) ON DELETE CASCADE,
  UNIQUE(habit_id, completed_at)
);

CREATE TABLE IF NOT EXISTS streak_freezes (
  id TEXT PRIMARY KEY,
  habit_id TEXT NOT NULL,
  freeze_date TEXT NOT NULL,
  created_at TEXT NOT NULL,
  FOREIGN KEY (habit_id) REFERENCES habits(id) ON DELETE CASCADE,
  UNIQUE(habit_id, freeze_date)
);

CREATE TABLE IF NOT EXISTS settings (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL
);
`;
