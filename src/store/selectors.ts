import { useHabitStore } from './habitStore';
import { isHabitScheduledForDate } from '../utils/dates';
import { getCurrentStreak, getLongestStreak, getAvailableFreezes as calcAvailableFreezes } from '../utils/streak';
import type { Habit } from '../types';

/** Returns habits scheduled for the given date, filtered by frequency. */
export function selectTodayHabits(date: string): Habit[] {
  const { habits } = useHabitStore.getState();
  return habits.filter((h) => isHabitScheduledForDate(h.frequency, date));
}

/** Returns completion progress for a given date. */
export function selectTodayProgress(date: string): { completed: number; total: number } {
  const { habits, completions } = useHabitStore.getState();
  const scheduled = habits.filter((h) => isHabitScheduledForDate(h.frequency, date));
  const completed = scheduled.filter((h) => completions[h.id]?.has(date)).length;
  return { completed, total: scheduled.length };
}

/** Checks if a specific habit is completed on a specific date. */
export function selectIsCompletedToday(habitId: string, date: string): boolean {
  const { completions } = useHabitStore.getState();
  return completions[habitId]?.has(date) ?? false;
}

/** Returns current streak result for a habit. */
export function selectCurrentStreak(habitId: string, today: string) {
  const { habits, completions, freezes } = useHabitStore.getState();
  const habit = habits.find((h) => h.id === habitId);
  if (!habit) return { count: 0, includesFreeze: false };

  return getCurrentStreak({
    completions: completions[habitId] ?? new Set(),
    freezes: freezes[habitId] ?? new Set(),
    frequency: habit.frequency,
    today,
  });
}

/** Returns longest streak for a habit. */
export function selectLongestStreak(habitId: string): number {
  const { habits, completions, freezes } = useHabitStore.getState();
  const habit = habits.find((h) => h.id === habitId);
  if (!habit) return 0;

  return getLongestStreak({
    completions: completions[habitId] ?? new Set(),
    freezes: freezes[habitId] ?? new Set(),
    frequency: habit.frequency,
  });
}

/** Returns available freezes (0 or 1) for a habit. */
export function selectAvailableFreezes(habitId: string, today: string): number {
  const { freezes } = useHabitStore.getState();
  return calcAvailableFreezes(freezes[habitId] ?? new Set(), today);
}
