import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import type { Habit, HabitFrequency } from '../types';

/** Parse "HH:MM" string into { hour, minute } numbers. */
export function parseReminderTime(time: string): { hour: number; minute: number } {
  const [hour, minute] = time.split(':').map(Number);
  return { hour, minute };
}

/** Format "HH:MM" 24h string into a human-readable "h:mm AM/PM" string. */
export function formatReminderTime(time: string): string {
  const { hour, minute } = parseReminderTime(time);
  const period = hour < 12 ? 'AM' : 'PM';
  const displayHour = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour;
  const displayMinute = minute.toString().padStart(2, '0');
  return `${displayHour}:${displayMinute} ${period}`;
}

/** Configure how notifications appear when the app is foregrounded. */
export function configureNotificationHandler(): void {
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowAlert: true,
      shouldPlaySound: true,
      shouldSetBadge: false,
      shouldShowBanner: true,
      shouldShowList: true,
    }),
  });
}

/** Request notification permissions. Returns true if granted. */
export async function requestNotificationPermissions(): Promise<boolean> {
  const { status: existingStatus } = await Notifications.getPermissionsAsync();

  if (existingStatus === 'granted') return true;
  if (existingStatus === 'denied') return false;

  // 'undetermined' — ask for permission
  const { status } = await Notifications.requestPermissionsAsync();
  return status === 'granted';
}

/**
 * Schedule a local notification reminder for a habit.
 *
 * - Daily habits: one DAILY notification (fires every day at the given time)
 * - Weekly habits: one WEEKLY notification per scheduled day
 *
 * Returns a notificationId string (comma-separated for weekly habits).
 */
export async function scheduleHabitReminder(
  habitName: string,
  reminderTime: string,
  frequency: HabitFrequency
): Promise<string> {
  // Set up Android notification channel on first schedule
  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('habit-reminders', {
      name: 'Habit Reminders',
      importance: Notifications.AndroidImportance.HIGH,
      sound: 'default',
    });
  }

  const { hour, minute } = parseReminderTime(reminderTime);
  const content = {
    title: 'Habit Reminder',
    body: `Time to ${habitName}!`,
    sound: true,
  };

  if (frequency.type === 'daily') {
    const id = await Notifications.scheduleNotificationAsync({
      content,
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.DAILY,
        hour,
        minute,
      },
    });
    return id;
  }

  // Weekly: one notification per scheduled weekday
  // App uses date-fns getDay(): 0=Sun, 1=Mon, ..., 6=Sat
  // expo-notifications uses: 1=Sun, 2=Mon, ..., 7=Sat
  // Conversion: expo weekday = appDay + 1
  const ids: string[] = [];
  for (const appDay of frequency.days) {
    const weekday = appDay + 1; // 0 (Sun) → 1, ..., 6 (Sat) → 7
    const id = await Notifications.scheduleNotificationAsync({
      content,
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.WEEKLY,
        weekday,
        hour,
        minute,
      },
    });
    ids.push(id);
  }
  return ids.join(',');
}

/**
 * Cancel a previously scheduled habit reminder.
 * Handles comma-separated IDs for weekly habits.
 */
export async function cancelHabitReminder(notificationId: string): Promise<void> {
  const ids = notificationId.split(',');
  await Promise.all(ids.map((id) => Notifications.cancelScheduledNotificationAsync(id)));
}

/**
 * Cancel all scheduled reminders for a list of habits.
 * Skips habits without a notificationId.
 */
export async function cancelAllHabitReminders(habits: Pick<Habit, 'notificationId'>[]): Promise<void> {
  const cancellations = habits
    .filter((h) => h.notificationId)
    .map((h) => cancelHabitReminder(h.notificationId!));
  await Promise.all(cancellations);
}
