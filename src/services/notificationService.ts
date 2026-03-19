import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

/** Configure notification handler (call once on app boot). */
export function configureNotifications() {
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowBanner: true,
      shouldShowList: true,
      shouldPlaySound: true,
      shouldSetBadge: false,
    }),
  });
}

/** Request notification permissions. Returns true if granted. */
export async function requestPermissions(): Promise<boolean> {
  const { status: existing } = await Notifications.getPermissionsAsync();
  if (existing === 'granted') return true;

  const { status } = await Notifications.requestPermissionsAsync();
  return status === 'granted';
}

/** Schedule a daily repeating notification for a habit.
 * Returns the notification identifier (for cancellation). */
export async function scheduleHabitReminder(
  habitName: string,
  hour: number,
  minute: number,
  habitId: string,
): Promise<string> {
  // Set up Android notification channel
  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('habit-reminders', {
      name: 'Habit Reminders',
      importance: Notifications.AndroidImportance.HIGH,
      sound: 'default',
    });
  }

  const id = await Notifications.scheduleNotificationAsync({
    content: {
      title: habitName,
      body: 'Time to check in!',
      data: { habitId, screen: 'habit-detail' },
      sound: true,
      ...(Platform.OS === 'android' && { channelId: 'habit-reminders' }),
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.DAILY,
      hour,
      minute,
    },
  });

  return id;
}

/** Cancel a scheduled notification by its identifier. */
export async function cancelNotification(notificationId: string): Promise<void> {
  await Notifications.cancelScheduledNotificationAsync(notificationId);
}

/** Cancel all scheduled notifications (e.g., when disabling globally). */
export async function cancelAllNotifications(): Promise<void> {
  await Notifications.cancelAllScheduledNotificationsAsync();
}
