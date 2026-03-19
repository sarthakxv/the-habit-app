import { CREATE_TABLES_SQL, SCHEMA_VERSION } from '../../src/db/schema';

describe('schema', () => {
  it('exports a schema version number', () => {
    expect(typeof SCHEMA_VERSION).toBe('number');
    expect(SCHEMA_VERSION).toBeGreaterThanOrEqual(1);
  });

  it('exports SQL that creates schema_version table', () => {
    expect(CREATE_TABLES_SQL).toContain('CREATE TABLE IF NOT EXISTS schema_version');
  });

  it('exports SQL that creates habits table with all columns', () => {
    expect(CREATE_TABLES_SQL).toContain('CREATE TABLE IF NOT EXISTS habits');
    expect(CREATE_TABLES_SQL).toContain('id TEXT PRIMARY KEY');
    expect(CREATE_TABLES_SQL).toContain('name TEXT NOT NULL');
    expect(CREATE_TABLES_SQL).toContain('color TEXT NOT NULL');
    expect(CREATE_TABLES_SQL).toContain('icon TEXT NOT NULL');
    expect(CREATE_TABLES_SQL).toContain('frequency TEXT NOT NULL');
    expect(CREATE_TABLES_SQL).toContain('reminder_time TEXT');
    expect(CREATE_TABLES_SQL).toContain('notification_id TEXT');
    expect(CREATE_TABLES_SQL).toContain('position INTEGER NOT NULL');
    expect(CREATE_TABLES_SQL).toContain('created_at TEXT NOT NULL');
    expect(CREATE_TABLES_SQL).toContain('archived INTEGER DEFAULT 0');
  });

  it('exports SQL that creates completions table with foreign key and unique constraint', () => {
    expect(CREATE_TABLES_SQL).toContain('CREATE TABLE IF NOT EXISTS completions');
    expect(CREATE_TABLES_SQL).toContain('habit_id TEXT NOT NULL');
    expect(CREATE_TABLES_SQL).toContain('completed_at TEXT NOT NULL');
    expect(CREATE_TABLES_SQL).toContain('FOREIGN KEY (habit_id) REFERENCES habits(id) ON DELETE CASCADE');
    expect(CREATE_TABLES_SQL).toContain('UNIQUE(habit_id, completed_at)');
  });

  it('exports SQL that creates streak_freezes table with foreign key and unique constraint', () => {
    expect(CREATE_TABLES_SQL).toContain('CREATE TABLE IF NOT EXISTS streak_freezes');
    expect(CREATE_TABLES_SQL).toContain('freeze_date TEXT NOT NULL');
    expect(CREATE_TABLES_SQL).toContain('FOREIGN KEY (habit_id) REFERENCES habits(id) ON DELETE CASCADE');
    expect(CREATE_TABLES_SQL).toContain('UNIQUE(habit_id, freeze_date)');
  });
});
