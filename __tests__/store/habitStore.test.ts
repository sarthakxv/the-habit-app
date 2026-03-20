/**
 * Zustand store tests.
 *
 * Strategy: Mock the database module entirely. The store's job is to:
 * 1. Call the right DB functions
 * 2. Update in-memory state on success
 * 3. NOT update state if DB throws
 */

// Mock the database module
jest.mock('../../src/db/database');
// Mock uuid
jest.mock('../../src/utils/uuid', () => ({
  generateId: jest.fn(() => 'mock-uuid'),
}));

import { useHabitStore } from '../../src/store/habitStore';
import * as db from '../../src/db/database';
import type { Habit, Completion, StreakFreeze } from '../../src/types';

const mockDb = {} as db.DatabaseLike;

// Reset store between tests
beforeEach(() => {
  useHabitStore.getState().reset();
  jest.clearAllMocks();
});

const makeHabit = (overrides: Partial<Habit> = {}): Habit => ({
  id: 'h1',
  name: 'Exercise',
  color: '#4CAF50',
  icon: '🏃',
  frequency: { type: 'daily' },
  reminderTime: null,
  notificationId: null,
  position: 0,
  createdAt: '2026-03-19T00:00:00Z',
  archived: false,
  ...overrides,
});

describe('habitStore', () => {
  describe('loadFromDB', () => {
    it('hydrates habits, archivedHabits, completions, and freezes from database', async () => {
      const habits: Habit[] = [makeHabit()];
      const archivedHabits: Habit[] = [makeHabit({ id: 'h2', name: 'Old Habit', archived: true })];
      const completions: Completion[] = [
        { id: 'c1', habitId: 'h1', completedAt: '2026-03-19' },
      ];
      const freezes: StreakFreeze[] = [
        { id: 'f1', habitId: 'h1', freezeDate: '2026-03-17', createdAt: '2026-03-18T00:00:00Z' },
      ];

      (db.getHabits as jest.Mock).mockResolvedValue(habits);
      (db.getArchivedHabits as jest.Mock).mockResolvedValue(archivedHabits);
      (db.getAllCompletions as jest.Mock).mockResolvedValue(completions);
      (db.getStreakFreezes as jest.Mock).mockResolvedValue(freezes);

      await useHabitStore.getState().loadFromDB(mockDb);

      const state = useHabitStore.getState();
      expect(state.habits).toEqual(habits);
      expect(state.archivedHabits).toEqual(archivedHabits);
      expect(state.completions['h1']?.has('2026-03-19')).toBe(true);
      expect(state.freezes['h1']?.has('2026-03-17')).toBe(true);
    });
  });

  describe('addHabit', () => {
    it('adds habit to DB and store', async () => {
      (db.insertHabit as jest.Mock).mockResolvedValue(undefined);

      await useHabitStore.getState().addHabit(mockDb, {
        name: 'Read',
        color: '#2196F3',
        icon: '📚',
        frequency: { type: 'daily' },
        reminderTime: null,
      });

      expect(db.insertHabit).toHaveBeenCalled();
      const state = useHabitStore.getState();
      expect(state.habits).toHaveLength(1);
      expect(state.habits[0].name).toBe('Read');
      expect(state.habits[0].id).toBe('mock-uuid');
    });

    it('does not update store if DB write fails', async () => {
      (db.insertHabit as jest.Mock).mockRejectedValue(new Error('DB error'));

      await expect(
        useHabitStore.getState().addHabit(mockDb, {
          name: 'Read',
          color: '#2196F3',
          icon: '📚',
          frequency: { type: 'daily' },
          reminderTime: null,
        })
      ).rejects.toThrow('DB error');

      expect(useHabitStore.getState().habits).toHaveLength(0);
    });

    it('enforces 15 habit cap', async () => {
      // Pre-fill store with 15 habits
      const habits = Array.from({ length: 15 }, (_, i) => makeHabit({ id: `h${i}`, position: i }));
      useHabitStore.setState({ habits });

      await expect(
        useHabitStore.getState().addHabit(mockDb, {
          name: 'One More',
          color: '#FF0000',
          icon: '❌',
          frequency: { type: 'daily' },
          reminderTime: null,
        })
      ).rejects.toThrow(/15/);

      expect(db.insertHabit).not.toHaveBeenCalled();
    });
  });

  describe('toggleCompletion', () => {
    it('adds completion when not yet completed', async () => {
      useHabitStore.setState({ habits: [makeHabit()] });
      (db.insertCompletion as jest.Mock).mockResolvedValue(undefined);

      await useHabitStore.getState().toggleCompletion(mockDb, 'h1', '2026-03-19');

      expect(db.insertCompletion).toHaveBeenCalled();
      expect(useHabitStore.getState().completions['h1']?.has('2026-03-19')).toBe(true);
    });

    it('removes completion when already completed', async () => {
      useHabitStore.setState({
        habits: [makeHabit()],
        completions: { h1: new Set(['2026-03-19']) },
      });
      (db.deleteCompletion as jest.Mock).mockResolvedValue(undefined);

      await useHabitStore.getState().toggleCompletion(mockDb, 'h1', '2026-03-19');

      expect(db.deleteCompletion).toHaveBeenCalledWith(mockDb, 'h1', '2026-03-19');
      expect(useHabitStore.getState().completions['h1']?.has('2026-03-19')).toBe(false);
    });
  });

  describe('archiveHabit', () => {
    it('removes habit from habits, adds to archivedHabits, and calls DB archive', async () => {
      const habit = makeHabit();
      useHabitStore.setState({ habits: [habit], archivedHabits: [] });
      (db.archiveHabit as jest.Mock).mockResolvedValue(undefined);

      await useHabitStore.getState().archiveHabit(mockDb, 'h1');

      expect(db.archiveHabit).toHaveBeenCalledWith(mockDb, 'h1');
      const state = useHabitStore.getState();
      expect(state.habits).toHaveLength(0);
      expect(state.archivedHabits).toHaveLength(1);
      expect(state.archivedHabits[0].id).toBe('h1');
      expect(state.archivedHabits[0].archived).toBe(true);
    });

    it('does not update store if DB archive fails', async () => {
      const habit = makeHabit();
      useHabitStore.setState({ habits: [habit], archivedHabits: [] });
      (db.archiveHabit as jest.Mock).mockRejectedValue(new Error('DB error'));

      await expect(useHabitStore.getState().archiveHabit(mockDb, 'h1')).rejects.toThrow('DB error');

      const state = useHabitStore.getState();
      expect(state.habits).toHaveLength(1);
      expect(state.archivedHabits).toHaveLength(0);
    });
  });

  describe('unarchiveHabit', () => {
    it('moves habit from archivedHabits back to habits and calls DB unarchive', async () => {
      const archived = makeHabit({ archived: true });
      useHabitStore.setState({ habits: [], archivedHabits: [archived] });
      (db.unarchiveHabit as jest.Mock).mockResolvedValue(undefined);

      await useHabitStore.getState().unarchiveHabit(mockDb, 'h1');

      expect(db.unarchiveHabit).toHaveBeenCalledWith(mockDb, 'h1');
      const state = useHabitStore.getState();
      expect(state.archivedHabits).toHaveLength(0);
      expect(state.habits).toHaveLength(1);
      expect(state.habits[0].archived).toBe(false);
    });

    it('does not update store if DB unarchive fails', async () => {
      const archived = makeHabit({ archived: true });
      useHabitStore.setState({ habits: [], archivedHabits: [archived] });
      (db.unarchiveHabit as jest.Mock).mockRejectedValue(new Error('DB error'));

      await expect(useHabitStore.getState().unarchiveHabit(mockDb, 'h1')).rejects.toThrow('DB error');

      const state = useHabitStore.getState();
      expect(state.archivedHabits).toHaveLength(1);
      expect(state.habits).toHaveLength(0);
    });
  });

  describe('deleteHabitPermanently', () => {
    it('removes an active habit from habits and calls DB delete', async () => {
      useHabitStore.setState({
        habits: [makeHabit()],
        completions: { h1: new Set(['2026-03-19']) },
        freezes: { h1: new Set(['2026-03-17']) },
      });
      (db.deleteHabitPermanently as jest.Mock).mockResolvedValue(undefined);

      await useHabitStore.getState().deleteHabitPermanently(mockDb, 'h1');

      expect(db.deleteHabitPermanently).toHaveBeenCalledWith(mockDb, 'h1');
      const state = useHabitStore.getState();
      expect(state.habits).toHaveLength(0);
      expect(state.completions['h1']).toBeUndefined();
      expect(state.freezes['h1']).toBeUndefined();
    });

    it('removes an archived habit from archivedHabits', async () => {
      const archived = makeHabit({ archived: true });
      useHabitStore.setState({ habits: [], archivedHabits: [archived] });
      (db.deleteHabitPermanently as jest.Mock).mockResolvedValue(undefined);

      await useHabitStore.getState().deleteHabitPermanently(mockDb, 'h1');

      const state = useHabitStore.getState();
      expect(state.archivedHabits).toHaveLength(0);
    });
  });

  describe('updateHabit', () => {
    it('updates habit in DB and store', async () => {
      useHabitStore.setState({ habits: [makeHabit()] });
      (db.updateHabit as jest.Mock).mockResolvedValue(undefined);

      await useHabitStore.getState().updateHabit(mockDb, 'h1', { name: 'New Name' });

      expect(db.updateHabit).toHaveBeenCalledWith(mockDb, 'h1', { name: 'New Name' });
      expect(useHabitStore.getState().habits[0].name).toBe('New Name');
    });
  });

  describe('reorderHabits', () => {
    it('updates positions in DB and store', async () => {
      const h1 = makeHabit({ id: 'h1', position: 0 });
      const h2 = makeHabit({ id: 'h2', position: 1, name: 'Read' });
      useHabitStore.setState({ habits: [h1, h2] });
      (db.updateHabitPositions as jest.Mock).mockResolvedValue(undefined);

      await useHabitStore.getState().reorderHabits(mockDb, ['h2', 'h1']);

      expect(db.updateHabitPositions).toHaveBeenCalledWith(mockDb, [
        { id: 'h2', position: 0 },
        { id: 'h1', position: 1 },
      ]);
      const state = useHabitStore.getState();
      expect(state.habits[0].id).toBe('h2');
      expect(state.habits[0].position).toBe(0);
    });
  });
});
