describe('project setup', () => {
  it('jest is configured and running', () => {
    expect(1 + 1).toBe(2);
  });

  it('can import types', () => {
    // Verify our type definitions are importable
    const habit: import('../src/types').Habit = {
      id: 'test-id',
      name: 'Test Habit',
      color: '#4CAF50',
      icon: '🏃',
      frequency: { type: 'daily' },
      reminderTime: null,
      notificationId: null,
      position: 0,
      createdAt: '2026-03-19T00:00:00Z',
      archived: false,
    };
    expect(habit.name).toBe('Test Habit');
    expect(habit.frequency.type).toBe('daily');
  });

  it('can import constants', () => {
    const { HABIT_COLORS } = require('../src/constants/colors');
    const { HABIT_ICONS } = require('../src/constants/icons');
    expect(HABIT_COLORS.length).toBe(12);
    expect(HABIT_ICONS.length).toBe(24);
  });
});
