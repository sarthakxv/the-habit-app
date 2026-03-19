import { format, subDays, getDay, parseISO } from 'date-fns';
import type { HabitFrequency } from '../types';

/**
 * Day numbering convention (matches JS getDay()):
 *   0 = Sunday, 1 = Monday, 2 = Tuesday, 3 = Wednesday,
 *   4 = Thursday, 5 = Friday, 6 = Saturday
 *
 * The UI displays "M T W T F S S" which maps to [1,2,3,4,5,6,0].
 * The frequency.days array uses these same numbers.
 */

/** Returns today's date as YYYY-MM-DD in the device's local timezone. */
export function getToday(): string {
  return format(new Date(), 'yyyy-MM-dd');
}

/** Formats a Date object to YYYY-MM-DD string. */
export function formatDate(date: Date): string {
  return format(date, 'yyyy-MM-dd');
}

/** Returns the day of week (0=Sun, 6=Sat) for a YYYY-MM-DD date string. */
export function getDayOfWeek(dateStr: string): number {
  return getDay(parseISO(dateStr));
}

/** Checks if a habit is scheduled for a given date based on its frequency. */
export function isHabitScheduledForDate(frequency: HabitFrequency, dateStr: string): boolean {
  if (frequency.type === 'daily') return true;
  const dayOfWeek = getDayOfWeek(dateStr);
  return frequency.days.includes(dayOfWeek);
}

/** Generator that yields YYYY-MM-DD strings going backward from startDate.
 * Yields exactly `count` dates, starting with startDate itself. */
export function* eachDayBackward(startDate: string, count: number): Generator<string> {
  const start = parseISO(startDate);
  for (let i = 0; i < count; i++) {
    yield format(subDays(start, i), 'yyyy-MM-dd');
  }
}
