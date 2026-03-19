import {
  initializeDatabase,
  getHabits,
  getAllCompletions,
  getStreakFreezes,
  insertHabit,
  updateHabit,
  archiveHabit,
  deleteHabitPermanently,
  insertCompletion,
  deleteCompletion,
  insertStreakFreeze,
  updateHabitPositions,
} from '../../src/db/database';
import { createMockDatabase } from '../helpers/mockDatabase';
import type { HabitRow, CompletionRow, StreakFreezeRow } from '../../src/types';

describe('database', () => {
  describe('initializeDatabase', () => {
    it('executes schema creation SQL and runs migrations', async () => {
      const db = createMockDatabase();
      db.getFirstAsync.mockResolvedValue({ version: 1 });

      await initializeDatabase(db);

      expect(db.execAsync).toHaveBeenCalledWith(expect.stringContaining('CREATE TABLE'));
    });
  });

  describe('getHabits', () => {
    it('returns active (non-archived) habits ordered by position', async () => {
      const mockRows: HabitRow[] = [
        {
          id: 'h1',
          name: 'Exercise',
          color: '#4CAF50',
          icon: '🏃',
          frequency: '{"type":"daily"}',
          reminder_time: '08:00',
          notification_id: 'notif-1',
          position: 0,
          created_at: '2026-03-19T00:00:00Z',
          archived: 0,
        },
        {
          id: 'h2',
          name: 'Read',
          color: '#2196F3',
          icon: '📚',
          frequency: '{"type":"weekly","days":[1,3,5]}',
          reminder_time: null,
          notification_id: null,
          position: 1,
          created_at: '2026-03-19T00:00:00Z',
          archived: 0,
        },
      ];
      const db = createMockDatabase();
      db.getAllAsync.mockResolvedValue(mockRows);

      const habits = await getHabits(db);

      expect(db.getAllAsync).toHaveBeenCalledWith(
        expect.stringContaining('archived = 0'),
        expect.anything()
      );
      expect(habits).toHaveLength(2);
      expect(habits[0].id).toBe('h1');
      expect(habits[0].frequency).toEqual({ type: 'daily' });
      expect(habits[0].archived).toBe(false);
      expect(habits[1].frequency).toEqual({ type: 'weekly', days: [1, 3, 5] });
      expect(habits[1].reminderTime).toBeNull();
    });

    it('returns empty array when no habits exist', async () => {
      const db = createMockDatabase();
      db.getAllAsync.mockResolvedValue([]);

      const habits = await getHabits(db);
      expect(habits).toEqual([]);
    });
  });

  describe('getAllCompletions', () => {
    it('returns all completions', async () => {
      const mockRows: CompletionRow[] = [
        { id: 'c1', habit_id: 'h1', completed_at: '2026-03-19' },
        { id: 'c2', habit_id: 'h1', completed_at: '2026-03-18' },
        { id: 'c3', habit_id: 'h2', completed_at: '2026-03-19' },
      ];
      const db = createMockDatabase();
      db.getAllAsync.mockResolvedValue(mockRows);

      const completions = await getAllCompletions(db);

      expect(completions).toHaveLength(3);
      expect(completions[0].habitId).toBe('h1');
      expect(completions[0].completedAt).toBe('2026-03-19');
    });
  });

  describe('getStreakFreezes', () => {
    it('returns all streak freezes', async () => {
      const mockRows: StreakFreezeRow[] = [
        { id: 'f1', habit_id: 'h1', freeze_date: '2026-03-17', created_at: '2026-03-18T00:00:00Z' },
      ];
      const db = createMockDatabase();
      db.getAllAsync.mockResolvedValue(mockRows);

      const freezes = await getStreakFreezes(db);

      expect(freezes).toHaveLength(1);
      expect(freezes[0].habitId).toBe('h1');
      expect(freezes[0].freezeDate).toBe('2026-03-17');
    });
  });

  describe('insertHabit', () => {
    it('inserts a habit with correct SQL params', async () => {
      const db = createMockDatabase();
      db.runAsync.mockResolvedValue({ changes: 1, lastInsertRowId: 0 });

      await insertHabit(db, {
        id: 'h1',
        name: 'Exercise',
        color: '#4CAF50',
        icon: '🏃',
        frequency: { type: 'daily' },
        reminderTime: '08:00',
        notificationId: null,
        position: 0,
        createdAt: '2026-03-19T00:00:00Z',
        archived: false,
      });

      expect(db.runAsync).toHaveBeenCalledWith(
        expect.stringContaining('INSERT INTO habits'),
        expect.arrayContaining(['h1', 'Exercise', '#4CAF50', '🏃'])
      );
    });

    it('serializes frequency as JSON string', async () => {
      const db = createMockDatabase();
      db.runAsync.mockResolvedValue({ changes: 1, lastInsertRowId: 0 });

      await insertHabit(db, {
        id: 'h1',
        name: 'Read',
        color: '#2196F3',
        icon: '📚',
        frequency: { type: 'weekly', days: [1, 3, 5] },
        reminderTime: null,
        notificationId: null,
        position: 0,
        createdAt: '2026-03-19T00:00:00Z',
        archived: false,
      });

      const callArgs = db.runAsync.mock.calls[0][1] as unknown[];
      expect(callArgs).toContainEqual('{"type":"weekly","days":[1,3,5]}');
    });
  });

  describe('updateHabit', () => {
    it('updates specified fields only', async () => {
      const db = createMockDatabase();
      db.runAsync.mockResolvedValue({ changes: 1, lastInsertRowId: 0 });

      await updateHabit(db, 'h1', { name: 'New Name', color: '#FF0000' });

      expect(db.runAsync).toHaveBeenCalledWith(
        expect.stringContaining('UPDATE habits SET'),
        expect.arrayContaining(['New Name', '#FF0000', 'h1'])
      );
    });

    it('handles frequency update by serializing to JSON', async () => {
      const db = createMockDatabase();
      db.runAsync.mockResolvedValue({ changes: 1, lastInsertRowId: 0 });

      await updateHabit(db, 'h1', { frequency: { type: 'weekly', days: [1, 5] } });

      const callArgs = db.runAsync.mock.calls[0][1] as unknown[];
      expect(callArgs).toContainEqual('{"type":"weekly","days":[1,5]}');
    });
  });

  describe('archiveHabit', () => {
    it('sets archived = 1 for the given habit', async () => {
      const db = createMockDatabase();
      db.runAsync.mockResolvedValue({ changes: 1, lastInsertRowId: 0 });

      await archiveHabit(db, 'h1');

      expect(db.runAsync).toHaveBeenCalledWith(
        expect.stringContaining('UPDATE habits SET archived = 1'),
        expect.arrayContaining(['h1'])
      );
    });
  });

  describe('deleteHabitPermanently', () => {
    it('deletes the habit row (cascade deletes completions and freezes)', async () => {
      const db = createMockDatabase();
      db.runAsync.mockResolvedValue({ changes: 1, lastInsertRowId: 0 });

      await deleteHabitPermanently(db, 'h1');

      expect(db.runAsync).toHaveBeenCalledWith(
        expect.stringContaining('DELETE FROM habits'),
        expect.arrayContaining(['h1'])
      );
    });
  });

  describe('insertCompletion', () => {
    it('inserts a completion row', async () => {
      const db = createMockDatabase();
      db.runAsync.mockResolvedValue({ changes: 1, lastInsertRowId: 0 });

      await insertCompletion(db, {
        id: 'c1',
        habitId: 'h1',
        completedAt: '2026-03-19',
      });

      expect(db.runAsync).toHaveBeenCalledWith(
        expect.stringContaining('INSERT INTO completions'),
        expect.arrayContaining(['c1', 'h1', '2026-03-19'])
      );
    });
  });

  describe('deleteCompletion', () => {
    it('deletes a completion by habit_id and date', async () => {
      const db = createMockDatabase();
      db.runAsync.mockResolvedValue({ changes: 1, lastInsertRowId: 0 });

      await deleteCompletion(db, 'h1', '2026-03-19');

      expect(db.runAsync).toHaveBeenCalledWith(
        expect.stringContaining('DELETE FROM completions'),
        expect.arrayContaining(['h1', '2026-03-19'])
      );
    });
  });

  describe('insertStreakFreeze', () => {
    it('inserts a streak freeze row', async () => {
      const db = createMockDatabase();
      db.runAsync.mockResolvedValue({ changes: 1, lastInsertRowId: 0 });

      await insertStreakFreeze(db, {
        id: 'f1',
        habitId: 'h1',
        freezeDate: '2026-03-17',
        createdAt: '2026-03-18T00:00:00Z',
      });

      expect(db.runAsync).toHaveBeenCalledWith(
        expect.stringContaining('INSERT INTO streak_freezes'),
        expect.arrayContaining(['f1', 'h1', '2026-03-17'])
      );
    });
  });

  describe('updateHabitPositions', () => {
    it('updates positions for multiple habits in a transaction', async () => {
      const db = createMockDatabase();
      db.runAsync.mockResolvedValue({ changes: 1, lastInsertRowId: 0 });
      db.withTransactionAsync.mockImplementation(async (fn: () => Promise<void>) => {
        await fn();
      });

      await updateHabitPositions(db, [
        { id: 'h2', position: 0 },
        { id: 'h1', position: 1 },
      ]);

      expect(db.withTransactionAsync).toHaveBeenCalled();
      expect(db.runAsync).toHaveBeenCalledTimes(2);
    });
  });
});
