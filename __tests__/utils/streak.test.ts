import { getCurrentStreak, getLongestStreak, getAvailableFreezes } from '../../src/utils/streak';
import type { HabitFrequency } from '../../src/types';

// Helper: creates a Set of date strings
function dateSet(...dates: string[]): Set<string> {
  return new Set(dates);
}

describe('streak', () => {
  describe('getCurrentStreak', () => {
    const daily: HabitFrequency = { type: 'daily' };

    it('returns 0 when no completions exist', () => {
      const result = getCurrentStreak({
        completions: new Set(),
        freezes: new Set(),
        frequency: daily,
        today: '2026-03-19',
      });
      expect(result.count).toBe(0);
    });

    it('returns 1 when only today is completed', () => {
      const result = getCurrentStreak({
        completions: dateSet('2026-03-19'),
        freezes: new Set(),
        frequency: daily,
        today: '2026-03-19',
      });
      expect(result.count).toBe(1);
    });

    it('counts consecutive days backward from today', () => {
      const result = getCurrentStreak({
        completions: dateSet('2026-03-19', '2026-03-18', '2026-03-17'),
        freezes: new Set(),
        frequency: daily,
        today: '2026-03-19',
      });
      expect(result.count).toBe(3);
    });

    it('stops at the first gap', () => {
      // Gap on March 17
      const result = getCurrentStreak({
        completions: dateSet('2026-03-19', '2026-03-18', '2026-03-16'),
        freezes: new Set(),
        frequency: daily,
        today: '2026-03-19',
      });
      expect(result.count).toBe(2);
    });

    it('includes today even when today is not completed (streak from yesterday)', () => {
      // User hasn't completed today yet, but had a streak going
      const result = getCurrentStreak({
        completions: dateSet('2026-03-18', '2026-03-17', '2026-03-16'),
        freezes: new Set(),
        frequency: daily,
        today: '2026-03-19',
      });
      // The streak is still alive (today isn't over yet), count from yesterday
      expect(result.count).toBe(3);
    });

    it('treats freeze days as completed — streak continues through a freeze', () => {
      // March 17 was missed but frozen
      const result = getCurrentStreak({
        completions: dateSet('2026-03-19', '2026-03-18', '2026-03-16'),
        freezes: dateSet('2026-03-17'),
        frequency: daily,
        today: '2026-03-19',
      });
      expect(result.count).toBe(4);
      expect(result.includesFreeze).toBe(true);
    });

    it('reports includesFreeze = false when no freezes in current streak', () => {
      const result = getCurrentStreak({
        completions: dateSet('2026-03-19', '2026-03-18'),
        freezes: new Set(),
        frequency: daily,
        today: '2026-03-19',
      });
      expect(result.includesFreeze).toBe(false);
    });

    describe('weekly habits', () => {
      const mwf: HabitFrequency = { type: 'weekly', days: [1, 3, 5] }; // Mon, Wed, Fri

      it('skips non-scheduled days when counting streak', () => {
        // Friday Mar 20, Wed Mar 18, Mon Mar 16 are scheduled
        // Tue, Thu, Sat, Sun are NOT scheduled — skip them
        const result = getCurrentStreak({
          completions: dateSet('2026-03-20', '2026-03-18', '2026-03-16'),
          freezes: new Set(),
          frequency: mwf,
          today: '2026-03-20', // Friday
        });
        expect(result.count).toBe(3);
      });

      it('breaks streak when a scheduled day is missed', () => {
        // Missed Wednesday Mar 18
        const result = getCurrentStreak({
          completions: dateSet('2026-03-20', '2026-03-16'),
          freezes: new Set(),
          frequency: mwf,
          today: '2026-03-20', // Friday
        });
        expect(result.count).toBe(1); // only Friday
      });

      it('freezes only apply to scheduled days', () => {
        // Wednesday Mar 18 missed but frozen
        const result = getCurrentStreak({
          completions: dateSet('2026-03-20', '2026-03-16'),
          freezes: dateSet('2026-03-18'),
          frequency: mwf,
          today: '2026-03-20',
        });
        expect(result.count).toBe(3);
        expect(result.includesFreeze).toBe(true);
      });
    });
  });

  describe('getLongestStreak', () => {
    const daily: HabitFrequency = { type: 'daily' };

    it('returns 0 when no completions exist', () => {
      expect(getLongestStreak({
        completions: new Set(),
        freezes: new Set(),
        frequency: daily,
      })).toBe(0);
    });

    it('returns 1 for a single completion', () => {
      expect(getLongestStreak({
        completions: dateSet('2026-03-19'),
        freezes: new Set(),
        frequency: daily,
      })).toBe(1);
    });

    it('finds the longest consecutive run', () => {
      // Two runs: 3 days and 5 days
      expect(getLongestStreak({
        completions: dateSet(
          '2026-03-01', '2026-03-02', '2026-03-03', // 3-day run
          // gap on Mar 4
          '2026-03-05', '2026-03-06', '2026-03-07', '2026-03-08', '2026-03-09', // 5-day run
        ),
        freezes: new Set(),
        frequency: daily,
      })).toBe(5);
    });

    it('counts freeze days as part of the streak', () => {
      expect(getLongestStreak({
        completions: dateSet('2026-03-01', '2026-03-02', '2026-03-04', '2026-03-05'),
        freezes: dateSet('2026-03-03'), // bridges the gap
        frequency: daily,
      })).toBe(5);
    });
  });

  describe('getAvailableFreezes', () => {
    it('returns 1 when no freezes have been used recently', () => {
      expect(getAvailableFreezes(new Set(), '2026-03-19')).toBe(1);
    });

    it('returns 0 when a freeze was used within the last 7 days', () => {
      expect(getAvailableFreezes(dateSet('2026-03-15'), '2026-03-19')).toBe(0);
    });

    it('returns 1 when all freezes are older than 7 days', () => {
      expect(getAvailableFreezes(dateSet('2026-03-10'), '2026-03-19')).toBe(1);
    });

    it('returns 0 when freeze was used exactly 6 days ago (within window)', () => {
      // Rolling 7-day window: today - 6 = Mar 13, so Mar 13 is included
      expect(getAvailableFreezes(dateSet('2026-03-13'), '2026-03-19')).toBe(0);
    });

    it('returns 1 when freeze was used exactly 7 days ago (outside window)', () => {
      // Mar 12 is 7 days before Mar 19 — outside the window
      expect(getAvailableFreezes(dateSet('2026-03-12'), '2026-03-19')).toBe(1);
    });
  });
});
