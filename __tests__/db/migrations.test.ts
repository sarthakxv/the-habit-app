import { runMigrations, MIGRATIONS } from '../../src/db/migrations';
import { SCHEMA_VERSION } from '../../src/db/schema';
import { createMockDatabase } from '../helpers/mockDatabase';

describe('migrations', () => {
  it('exports a MIGRATIONS array', () => {
    expect(Array.isArray(MIGRATIONS)).toBe(true);
  });

  it('MIGRATIONS length matches SCHEMA_VERSION - 1 (one migration per version bump)', () => {
    // Version 1 is the initial schema, migrations start from version 2
    expect(MIGRATIONS.length).toBe(SCHEMA_VERSION - 1);
  });

  it('each migration has a version and up function', () => {
    for (const migration of MIGRATIONS) {
      expect(typeof migration.version).toBe('number');
      expect(typeof migration.up).toBe('function');
    }
  });

  it('migration versions are sequential starting from 2', () => {
    MIGRATIONS.forEach((migration, index) => {
      expect(migration.version).toBe(index + 2);
    });
  });

  describe('runMigrations', () => {
    it('does nothing when database is at current version', async () => {
      const db = createMockDatabase();
      db.getFirstAsync.mockResolvedValue({ version: SCHEMA_VERSION });

      await runMigrations(db);

      // Should only query version, not run any migrations
      expect(db.execAsync).not.toHaveBeenCalled();
    });

    it('runs pending migrations when database is behind', async () => {
      const db = createMockDatabase();
      db.getFirstAsync.mockResolvedValue({ version: 1 });
      db.runAsync.mockResolvedValue({ changes: 1, lastInsertRowId: 0 });

      await runMigrations(db);

      // Should update schema_version for each migration run
      if (MIGRATIONS.length > 0) {
        expect(db.runAsync).toHaveBeenCalled();
      }
    });

    it('initializes schema_version to 1 when table is empty', async () => {
      const db = createMockDatabase();
      db.getFirstAsync.mockResolvedValue(null); // no version row

      await runMigrations(db);

      // Should insert initial version
      expect(db.runAsync).toHaveBeenCalledWith(
        expect.stringContaining('INSERT INTO schema_version'),
        expect.anything()
      );
    });
  });
});
