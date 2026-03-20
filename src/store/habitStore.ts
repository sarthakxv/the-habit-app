import { create } from 'zustand';
import type { Habit, Completion, StreakFreeze, HabitFrequency } from '../types';
import {
  type DatabaseLike,
  getHabits,
  getArchivedHabits,
  getAllCompletions,
  getStreakFreezes,
  insertHabit,
  updateHabit as dbUpdateHabit,
  archiveHabit as dbArchiveHabit,
  unarchiveHabit as dbUnarchiveHabit,
  deleteHabitPermanently as dbDeleteHabit,
  insertCompletion,
  deleteCompletion,
  insertStreakFreeze,
  updateHabitPositions,
} from '../db/database';
import { generateId } from '../utils/uuid';
import { getToday } from '../utils/dates';

const MAX_HABITS = 15;

interface NewHabitInput {
  name: string;
  color: string;
  icon: string;
  frequency: HabitFrequency;
  reminderTime: string | null;
}

interface HabitState {
  habits: Habit[];
  archivedHabits: Habit[];
  /** All completions indexed by habitId. Set<dateString> for O(1) lookup. */
  completions: Record<string, Set<string>>;
  /** Streak freeze dates indexed by habitId. */
  freezes: Record<string, Set<string>>;

  // Actions
  loadFromDB: (db: DatabaseLike) => Promise<void>;
  addHabit: (db: DatabaseLike, input: NewHabitInput) => Promise<Habit>;
  updateHabit: (db: DatabaseLike, id: string, updates: Partial<Pick<Habit, 'name' | 'color' | 'icon' | 'frequency' | 'reminderTime' | 'notificationId' | 'position'>>) => Promise<void>;
  archiveHabit: (db: DatabaseLike, id: string) => Promise<void>;
  unarchiveHabit: (db: DatabaseLike, id: string) => Promise<void>;
  deleteHabitPermanently: (db: DatabaseLike, id: string) => Promise<void>;
  toggleCompletion: (db: DatabaseLike, habitId: string, date: string) => Promise<void>;
  reorderHabits: (db: DatabaseLike, orderedIds: string[]) => Promise<void>;
  reset: () => void;
}

const initialState = {
  habits: [] as Habit[],
  archivedHabits: [] as Habit[],
  completions: {} as Record<string, Set<string>>,
  freezes: {} as Record<string, Set<string>>,
};

export const useHabitStore = create<HabitState>((set, get) => ({
  ...initialState,

  reset: () => set(initialState),

  loadFromDB: async (db) => {
    const [habits, archivedHabits, completions, freezes] = await Promise.all([
      getHabits(db),
      getArchivedHabits(db),
      getAllCompletions(db),
      getStreakFreezes(db),
    ]);

    // Build completion lookup: habitId -> Set<dateString>
    const completionMap: Record<string, Set<string>> = {};
    for (const c of completions) {
      if (!completionMap[c.habitId]) completionMap[c.habitId] = new Set();
      completionMap[c.habitId].add(c.completedAt);
    }

    // Build freeze lookup: habitId -> Set<dateString>
    const freezeMap: Record<string, Set<string>> = {};
    for (const f of freezes) {
      if (!freezeMap[f.habitId]) freezeMap[f.habitId] = new Set();
      freezeMap[f.habitId].add(f.freezeDate);
    }

    set({ habits, archivedHabits, completions: completionMap, freezes: freezeMap });
  },

  addHabit: async (db, input) => {
    const { habits } = get();
    if (habits.length >= MAX_HABITS) {
      throw new Error(`Cannot add more than ${MAX_HABITS} habits. Archive or delete an existing habit first.`);
    }

    const habit: Habit = {
      id: generateId(),
      name: input.name,
      color: input.color,
      icon: input.icon,
      frequency: input.frequency,
      reminderTime: input.reminderTime,
      notificationId: null,
      position: habits.length,
      createdAt: new Date().toISOString(),
      archived: false,
    };

    // DB first, then store
    await insertHabit(db, habit);
    set({ habits: [...habits, habit] });

    return habit;
  },

  updateHabit: async (db, id, updates) => {
    // DB first
    await dbUpdateHabit(db, id, updates);

    // Then update store
    set((state) => ({
      habits: state.habits.map((h) =>
        h.id === id ? { ...h, ...updates } : h
      ),
    }));
  },

  archiveHabit: async (db, id) => {
    const { habits } = get();
    const habit = habits.find((h) => h.id === id);

    await dbArchiveHabit(db, id);
    set((state) => ({
      habits: state.habits.filter((h) => h.id !== id),
      archivedHabits: habit
        ? [...state.archivedHabits, { ...habit, archived: true }]
        : state.archivedHabits,
    }));
  },

  unarchiveHabit: async (db, id) => {
    await dbUnarchiveHabit(db, id);
    set((state) => {
      const habit = state.archivedHabits.find((h) => h.id === id);
      return {
        archivedHabits: state.archivedHabits.filter((h) => h.id !== id),
        habits: habit
          ? [...state.habits, { ...habit, archived: false }]
          : state.habits,
      };
    });
  },

  deleteHabitPermanently: async (db, id) => {
    await dbDeleteHabit(db, id);
    set((state) => {
      const { [id]: _completions, ...restCompletions } = state.completions;
      const { [id]: _freezes, ...restFreezes } = state.freezes;
      return {
        habits: state.habits.filter((h) => h.id !== id),
        archivedHabits: state.archivedHabits.filter((h) => h.id !== id),
        completions: restCompletions,
        freezes: restFreezes,
      };
    });
  },

  toggleCompletion: async (db, habitId, date) => {
    const { completions } = get();
    const habitCompletions = completions[habitId] ?? new Set();
    const isCompleted = habitCompletions.has(date);

    if (isCompleted) {
      // Remove completion — DB first
      await deleteCompletion(db, habitId, date);
      set((state) => {
        const updated = new Set(state.completions[habitId]);
        updated.delete(date);
        return { completions: { ...state.completions, [habitId]: updated } };
      });
    } else {
      // Add completion — DB first
      const completion: Completion = {
        id: generateId(),
        habitId,
        completedAt: date,
      };
      await insertCompletion(db, completion);
      set((state) => {
        const updated = new Set(state.completions[habitId] ?? []);
        updated.add(date);
        return { completions: { ...state.completions, [habitId]: updated } };
      });
    }
  },

  reorderHabits: async (db, orderedIds) => {
    const positions = orderedIds.map((id, index) => ({ id, position: index }));

    // DB first
    await updateHabitPositions(db, positions);

    // Then update store
    set((state) => {
      const habitMap = new Map(state.habits.map((h) => [h.id, h]));
      const reordered = orderedIds
        .map((id, index) => {
          const habit = habitMap.get(id);
          if (!habit) return null;
          return { ...habit, position: index };
        })
        .filter((h): h is Habit => h !== null);
      return { habits: reordered };
    });
  },
}));
