import {
  parseReminderTime,
  formatReminderTime,
  scheduleHabitReminder,
  cancelHabitReminder,
  cancelAllHabitReminders,
  requestNotificationPermissions,
} from '@/src/utils/notifications';
import type { HabitFrequency } from '@/src/types';

// Mock expo-notifications
const mockScheduleNotification = jest.fn();
const mockCancelNotification = jest.fn();
const mockGetPermissions = jest.fn();
const mockRequestPermissions = jest.fn();
const mockSetNotificationHandler = jest.fn();
const mockSetNotificationChannelAsync = jest.fn();

jest.mock('expo-notifications', () => ({
  SchedulableTriggerInputTypes: {
    DAILY: 'daily',
    WEEKLY: 'weekly',
  },
  scheduleNotificationAsync: (...args: unknown[]) => mockScheduleNotification(...args),
  cancelScheduledNotificationAsync: (...args: unknown[]) => mockCancelNotification(...args),
  getPermissionsAsync: (...args: unknown[]) => mockGetPermissions(...args),
  requestPermissionsAsync: (...args: unknown[]) => mockRequestPermissions(...args),
  setNotificationHandler: (...args: unknown[]) => mockSetNotificationHandler(...args),
  setNotificationChannelAsync: (...args: unknown[]) => mockSetNotificationChannelAsync(...args),
  AndroidImportance: { HIGH: 4 },
}));

// Mock Platform
jest.mock('react-native', () => ({
  Platform: { OS: 'ios' },
}));

beforeEach(() => {
  jest.clearAllMocks();
  mockCancelNotification.mockResolvedValue(undefined);
  mockSetNotificationHandler.mockReturnValue(undefined);
  mockSetNotificationChannelAsync.mockResolvedValue(null);
});

// ─── parseReminderTime ───────────────────────────────────────────────────────

describe('parseReminderTime', () => {
  it('parses "08:30" into { hour: 8, minute: 30 }', () => {
    expect(parseReminderTime('08:30')).toEqual({ hour: 8, minute: 30 });
  });

  it('parses "00:00" into { hour: 0, minute: 0 }', () => {
    expect(parseReminderTime('00:00')).toEqual({ hour: 0, minute: 0 });
  });

  it('parses "23:59" into { hour: 23, minute: 59 }', () => {
    expect(parseReminderTime('23:59')).toEqual({ hour: 23, minute: 59 });
  });
});

// ─── formatReminderTime ──────────────────────────────────────────────────────

describe('formatReminderTime', () => {
  it('formats morning time as "8:30 AM"', () => {
    expect(formatReminderTime('08:30')).toBe('8:30 AM');
  });

  it('formats noon as "12:00 PM"', () => {
    expect(formatReminderTime('12:00')).toBe('12:00 PM');
  });

  it('formats midnight as "12:00 AM"', () => {
    expect(formatReminderTime('00:00')).toBe('12:00 AM');
  });

  it('formats afternoon as "3:30 PM"', () => {
    expect(formatReminderTime('15:30')).toBe('3:30 PM');
  });

  it('formats 1pm correctly', () => {
    expect(formatReminderTime('13:00')).toBe('1:00 PM');
  });
});

// ─── requestNotificationPermissions ─────────────────────────────────────────

describe('requestNotificationPermissions', () => {
  it('returns true when already granted', async () => {
    mockGetPermissions.mockResolvedValue({ status: 'granted' });
    const result = await requestNotificationPermissions();
    expect(result).toBe(true);
    expect(mockRequestPermissions).not.toHaveBeenCalled();
  });

  it('requests and returns true when permission granted after request', async () => {
    mockGetPermissions.mockResolvedValue({ status: 'undetermined' });
    mockRequestPermissions.mockResolvedValue({ status: 'granted' });
    const result = await requestNotificationPermissions();
    expect(result).toBe(true);
    expect(mockRequestPermissions).toHaveBeenCalledTimes(1);
  });

  it('returns false when permission denied', async () => {
    mockGetPermissions.mockResolvedValue({ status: 'denied' });
    const result = await requestNotificationPermissions();
    expect(result).toBe(false);
    expect(mockRequestPermissions).not.toHaveBeenCalled();
  });
});

// ─── scheduleHabitReminder ───────────────────────────────────────────────────

describe('scheduleHabitReminder', () => {
  it('schedules a single DAILY notification for a daily habit', async () => {
    mockScheduleNotification.mockResolvedValue('notification-id-1');
    const frequency: HabitFrequency = { type: 'daily' };

    const result = await scheduleHabitReminder('Exercise', '07:30', frequency);

    expect(result).toBe('notification-id-1');
    expect(mockScheduleNotification).toHaveBeenCalledTimes(1);
    expect(mockScheduleNotification).toHaveBeenCalledWith({
      content: {
        title: 'Habit Reminder',
        body: 'Time to Exercise!',
        sound: true,
      },
      trigger: {
        type: 'daily',
        hour: 7,
        minute: 30,
      },
    });
  });

  it('schedules one WEEKLY notification per day for a weekly habit', async () => {
    mockScheduleNotification
      .mockResolvedValueOnce('notif-mon')
      .mockResolvedValueOnce('notif-wed')
      .mockResolvedValueOnce('notif-fri');

    const frequency: HabitFrequency = { type: 'weekly', days: [1, 3, 5] };

    const result = await scheduleHabitReminder('Read', '20:00', frequency);

    expect(result).toBe('notif-mon,notif-wed,notif-fri');
    expect(mockScheduleNotification).toHaveBeenCalledTimes(3);

    // Monday (day 1) → expo weekday 2
    expect(mockScheduleNotification).toHaveBeenCalledWith({
      content: { title: 'Habit Reminder', body: 'Time to Read!', sound: true },
      trigger: { type: 'weekly', weekday: 2, hour: 20, minute: 0 },
    });
    // Wednesday (day 3) → expo weekday 4
    expect(mockScheduleNotification).toHaveBeenCalledWith({
      content: { title: 'Habit Reminder', body: 'Time to Read!', sound: true },
      trigger: { type: 'weekly', weekday: 4, hour: 20, minute: 0 },
    });
    // Friday (day 5) → expo weekday 6
    expect(mockScheduleNotification).toHaveBeenCalledWith({
      content: { title: 'Habit Reminder', body: 'Time to Read!', sound: true },
      trigger: { type: 'weekly', weekday: 6, hour: 20, minute: 0 },
    });
  });

  it('maps Sunday (day 0) to expo weekday 1', async () => {
    mockScheduleNotification.mockResolvedValue('notif-sun');
    const frequency: HabitFrequency = { type: 'weekly', days: [0] };

    await scheduleHabitReminder('Meditate', '09:00', frequency);

    expect(mockScheduleNotification).toHaveBeenCalledWith({
      content: { title: 'Habit Reminder', body: 'Time to Meditate!', sound: true },
      trigger: { type: 'weekly', weekday: 1, hour: 9, minute: 0 },
    });
  });

  it('maps Saturday (day 6) to expo weekday 7', async () => {
    mockScheduleNotification.mockResolvedValue('notif-sat');
    const frequency: HabitFrequency = { type: 'weekly', days: [6] };

    await scheduleHabitReminder('Yoga', '08:00', frequency);

    expect(mockScheduleNotification).toHaveBeenCalledWith({
      content: { title: 'Habit Reminder', body: 'Time to Yoga!', sound: true },
      trigger: { type: 'weekly', weekday: 7, hour: 8, minute: 0 },
    });
  });
});

// ─── cancelHabitReminder ─────────────────────────────────────────────────────

describe('cancelHabitReminder', () => {
  it('cancels a single notification ID', async () => {
    await cancelHabitReminder('notification-id-1');
    expect(mockCancelNotification).toHaveBeenCalledTimes(1);
    expect(mockCancelNotification).toHaveBeenCalledWith('notification-id-1');
  });

  it('cancels all comma-separated IDs for weekly habits', async () => {
    await cancelHabitReminder('notif-mon,notif-wed,notif-fri');
    expect(mockCancelNotification).toHaveBeenCalledTimes(3);
    expect(mockCancelNotification).toHaveBeenCalledWith('notif-mon');
    expect(mockCancelNotification).toHaveBeenCalledWith('notif-wed');
    expect(mockCancelNotification).toHaveBeenCalledWith('notif-fri');
  });
});

// ─── cancelAllHabitReminders ─────────────────────────────────────────────────

describe('cancelAllHabitReminders', () => {
  it('cancels reminders for all habits that have a notificationId', async () => {
    const habits = [
      { id: '1', notificationId: 'notif-1', reminderTime: '08:00' },
      { id: '2', notificationId: null, reminderTime: null },
      { id: '3', notificationId: 'notif-3a,notif-3b', reminderTime: '20:00' },
    ] as any[];

    await cancelAllHabitReminders(habits);

    expect(mockCancelNotification).toHaveBeenCalledTimes(3);
    expect(mockCancelNotification).toHaveBeenCalledWith('notif-1');
    expect(mockCancelNotification).toHaveBeenCalledWith('notif-3a');
    expect(mockCancelNotification).toHaveBeenCalledWith('notif-3b');
  });

  it('handles empty habits array gracefully', async () => {
    await cancelAllHabitReminders([]);
    expect(mockCancelNotification).not.toHaveBeenCalled();
  });
});
