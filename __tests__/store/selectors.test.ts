jest.mock('../../src/utils/uuid', () => ({
  generateId: jest.fn(() => 'mock-uuid'),
}));

import { useHabitStore } from '../../src/store/habitStore';
import {
  selectTodayHabits,
  selectTodayProgress,
  selectIsCompletedToday,
  selectCurrentStreak,
  selectLongestStreak,
  selectAvailableFreezes,
} from '../../src/store/selectors';
import type { Habit } from '../../src/types';

beforeEach(() => {
  useHabitStore.getState().reset();
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

describe('selectors', () => {
  describe('selectTodayHabits', () => {
    it('filters habits scheduled for the given date', () => {
      const daily = makeHabit({ id: 'h1' });
      // 2026-03-19 is Thursday (day 4). This habit is Mon/Wed/Fri only.
      const mwf = makeHabit({
        id: 'h2',
        name: 'Read',
        frequency: { type: 'weekly', days: [1, 3, 5] },
      });
      useHabitStore.setState({ habits: [daily, mwf] });

      const result = selectTodayHabits('2026-03-19');
      expect(result).toHaveLength(1);
      expect(result[0].id).toBe('h1');
    });

    it('includes weekly habits on their scheduled day', () => {
      const mwf = makeHabit({
        id: 'h2',
        frequency: { type: 'weekly', days: [1, 3, 5] },
      });
      useHabitStore.setState({ habits: [mwf] });

      // 2026-03-20 is Friday (day 5)
      const result = selectTodayHabits('2026-03-20');
      expect(result).toHaveLength(1);
    });
  });

  describe('selectTodayProgress', () => {
    it('returns completed / total for the day', () => {
      const h1 = makeHabit({ id: 'h1' });
      const h2 = makeHabit({ id: 'h2', name: 'Read' });
      useHabitStore.setState({
        habits: [h1, h2],
        completions: { h1: new Set(['2026-03-19']) },
      });

      const result = selectTodayProgress('2026-03-19');
      expect(result.completed).toBe(1);
      expect(result.total).toBe(2);
    });

    it('returns 0/0 when no habits are scheduled', () => {
      useHabitStore.setState({ habits: [] });
      const result = selectTodayProgress('2026-03-19');
      expect(result.completed).toBe(0);
      expect(result.total).toBe(0);
    });
  });

  describe('selectIsCompletedToday', () => {
    it('returns true when habit has completion for the date', () => {
      useHabitStore.setState({
        completions: { h1: new Set(['2026-03-19']) },
      });
      expect(selectIsCompletedToday('h1', '2026-03-19')).toBe(true);
    });

    it('returns false when habit has no completion for the date', () => {
      useHabitStore.setState({ completions: {} });
      expect(selectIsCompletedToday('h1', '2026-03-19')).toBe(false);
    });
  });

  describe('selectCurrentStreak', () => {
    it('returns streak result for a habit', () => {
      useHabitStore.setState({
        habits: [makeHabit()],
        completions: { h1: new Set(['2026-03-19', '2026-03-18', '2026-03-17']) },
        freezes: {},
      });

      const result = selectCurrentStreak('h1', '2026-03-19');
      expect(result.count).toBe(3);
      expect(result.includesFreeze).toBe(false);
    });
  });

  describe('selectLongestStreak', () => {
    it('returns longest streak for a habit', () => {
      useHabitStore.setState({
        habits: [makeHabit()],
        completions: {
          h1: new Set(['2026-03-01', '2026-03-02', '2026-03-03']),
        },
        freezes: {},
      });

      expect(selectLongestStreak('h1')).toBe(3);
    });
  });

  describe('selectAvailableFreezes', () => {
    it('returns 1 when no recent freezes', () => {
      useHabitStore.setState({ freezes: {} });
      expect(selectAvailableFreezes('h1', '2026-03-19')).toBe(1);
    });

    it('returns 0 when freeze used recently', () => {
      useHabitStore.setState({
        freezes: { h1: new Set(['2026-03-17']) },
      });
      expect(selectAvailableFreezes('h1', '2026-03-19')).toBe(0);
    });
  });
});
