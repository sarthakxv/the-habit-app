import { getToday, formatDate, getDayOfWeek, isHabitScheduledForDate, eachDayBackward } from '../../src/utils/dates';

describe('dates', () => {
  describe('getToday', () => {
    it('returns a date string in YYYY-MM-DD format', () => {
      const today = getToday();
      expect(today).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    });
  });

  describe('formatDate', () => {
    it('formats a Date object to YYYY-MM-DD string', () => {
      const date = new Date(2026, 2, 19); // March 19, 2026 (month is 0-indexed)
      expect(formatDate(date)).toBe('2026-03-19');
    });

    it('pads single-digit months and days', () => {
      const date = new Date(2026, 0, 5); // January 5
      expect(formatDate(date)).toBe('2026-01-05');
    });
  });

  describe('getDayOfWeek', () => {
    it('returns 0 for Sunday', () => {
      // 2026-03-22 is a Sunday
      expect(getDayOfWeek('2026-03-22')).toBe(0);
    });

    it('returns 1 for Monday', () => {
      // 2026-03-23 is a Monday
      expect(getDayOfWeek('2026-03-23')).toBe(1);
    });

    it('returns 4 for Thursday', () => {
      // 2026-03-19 is a Thursday
      expect(getDayOfWeek('2026-03-19')).toBe(4);
    });

    it('returns 6 for Saturday', () => {
      // 2026-03-21 is a Saturday
      expect(getDayOfWeek('2026-03-21')).toBe(6);
    });
  });

  describe('isHabitScheduledForDate', () => {
    it('returns true for any date when frequency is daily', () => {
      expect(isHabitScheduledForDate({ type: 'daily' }, '2026-03-19')).toBe(true);
      expect(isHabitScheduledForDate({ type: 'daily' }, '2026-03-22')).toBe(true);
    });

    it('returns true when date falls on a scheduled weekly day', () => {
      // Mon, Wed, Fri = [1, 3, 5]
      const freq = { type: 'weekly' as const, days: [1, 3, 5] };
      expect(isHabitScheduledForDate(freq, '2026-03-23')).toBe(true); // Monday
      expect(isHabitScheduledForDate(freq, '2026-03-25')).toBe(true); // Wednesday
      expect(isHabitScheduledForDate(freq, '2026-03-27')).toBe(true); // Friday
    });

    it('returns false when date does not fall on a scheduled weekly day', () => {
      const freq = { type: 'weekly' as const, days: [1, 3, 5] };
      expect(isHabitScheduledForDate(freq, '2026-03-19')).toBe(false); // Thursday
      expect(isHabitScheduledForDate(freq, '2026-03-22')).toBe(false); // Sunday
      expect(isHabitScheduledForDate(freq, '2026-03-24')).toBe(false); // Tuesday
    });
  });

  describe('eachDayBackward', () => {
    it('generates date strings going backward from a start date', () => {
      const dates = Array.from(eachDayBackward('2026-03-19', 5));
      expect(dates).toEqual([
        '2026-03-19',
        '2026-03-18',
        '2026-03-17',
        '2026-03-16',
        '2026-03-15',
      ]);
    });

    it('handles month boundaries', () => {
      const dates = Array.from(eachDayBackward('2026-03-02', 4));
      expect(dates).toEqual([
        '2026-03-02',
        '2026-03-01',
        '2026-02-28',
        '2026-02-27',
      ]);
    });
  });
});
