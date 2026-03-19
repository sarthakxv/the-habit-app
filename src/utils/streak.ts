import { subDays, parseISO, differenceInCalendarDays } from 'date-fns';
import { formatDate, isHabitScheduledForDate } from './dates';
import type { HabitFrequency } from '../types';

export interface StreakResult {
  count: number;
  includesFreeze: boolean;
}

interface CurrentStreakParams {
  completions: Set<string>;
  freezes: Set<string>;
  frequency: HabitFrequency;
  today: string;
}

/**
 * Counts the current streak backward from today.
 *
 * Logic:
 * - Start from today. If today is not completed, start from yesterday
 *   (the user still has time to complete today).
 * - Walk backward one day at a time.
 * - Skip non-scheduled days (for weekly habits).
 * - Count days that are completed OR frozen.
 * - Stop at the first scheduled day that is neither completed nor frozen.
 */
export function getCurrentStreak(params: CurrentStreakParams): StreakResult {
  const { completions, freezes, frequency, today } = params;
  let count = 0;
  let includesFreeze = false;
  const todayDate = parseISO(today);

  // Determine start: if today is completed, start from today. Otherwise, yesterday.
  const startDate = completions.has(today) || freezes.has(today)
    ? todayDate
    : subDays(todayDate, 1);

  // Walk backward up to 1000 days (safety limit)
  for (let i = 0; i < 1000; i++) {
    const date = subDays(startDate, i);
    const dateStr = formatDate(date);

    // Skip non-scheduled days for weekly habits
    if (!isHabitScheduledForDate(frequency, dateStr)) {
      continue;
    }

    if (completions.has(dateStr)) {
      count++;
    } else if (freezes.has(dateStr)) {
      count++;
      includesFreeze = true;
    } else {
      break; // Streak broken
    }
  }

  return { count, includesFreeze };
}

interface LongestStreakParams {
  completions: Set<string>;
  freezes: Set<string>;
  frequency: HabitFrequency;
}

/**
 * Finds the longest consecutive streak across all completions.
 *
 * Sorts all completion + freeze dates, then scans for the longest
 * consecutive run of scheduled days.
 */
export function getLongestStreak(params: LongestStreakParams): number {
  const { completions, freezes, frequency } = params;

  // Merge all "covered" dates (completed or frozen)
  const allDates = new Set([...completions, ...freezes]);
  if (allDates.size === 0) return 0;

  // Sort dates ascending
  const sorted = Array.from(allDates).sort();

  let longest = 0;
  let current = 0;

  for (let i = 0; i < sorted.length; i++) {
    if (i === 0) {
      current = 1;
    } else {
      // Check if this date is the next scheduled day after the previous one
      const prevDate = parseISO(sorted[i - 1]);
      const currDate = parseISO(sorted[i]);

      // Walk forward from prevDate to see if currDate is the next scheduled day
      let nextScheduled = prevDate;
      let found = false;
      for (let d = 1; d <= 7; d++) {
        const candidate = new Date(prevDate.getTime() + d * 86400000);
        const candidateStr = formatDate(candidate);
        if (isHabitScheduledForDate(frequency, candidateStr)) {
          if (differenceInCalendarDays(currDate, candidate) === 0) {
            found = true;
          }
          break; // First scheduled day after prev
        }
      }

      if (found) {
        current++;
      } else {
        current = 1;
      }
    }
    longest = Math.max(longest, current);
  }

  return longest;
}

/**
 * Returns the number of available freezes for a habit (0 or 1).
 * One freeze per rolling 7-day window: count freezes where
 * freeze_date >= today - 6 days. If count is 0, one freeze is available.
 */
export function getAvailableFreezes(freezeDates: Set<string>, today: string): number {
  const todayDate = parseISO(today);
  const windowStart = subDays(todayDate, 6); // 7-day window: today and 6 days before

  let recentFreezeCount = 0;
  for (const dateStr of freezeDates) {
    const date = parseISO(dateStr);
    if (date >= windowStart && date <= todayDate) {
      recentFreezeCount++;
    }
  }

  return recentFreezeCount === 0 ? 1 : 0;
}
