import React, { useCallback, useMemo, useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useHabitStore } from '@/src/store/habitStore';
import { selectCurrentStreak, selectLongestStreak, selectIsCompletedToday } from '@/src/store/selectors';
import { getToday } from '@/src/utils/dates';
import { getDatabase } from '@/src/hooks/useBootLoader';
import { StreakBadge } from '@/src/components/StreakBadge';
import { EditHabitModal } from '@/src/components/EditHabitModal';
import { HabitIcon } from '@/src/components/HabitIcon';
import { ReminderTimePicker } from '@/src/components/ReminderTimePicker';
import { useThemeColors } from '@/src/hooks/useThemeColors';
import { neo } from '@/src/constants/theme';
import { eachDayBackward } from '@/src/utils/dates';
import {
  scheduleHabitReminder,
  cancelHabitReminder,
  requestNotificationPermissions,
} from '@/src/utils/notifications';

export default function HabitDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const colors = useThemeColors();
  const today = getToday();

  const habit = useHabitStore((s) => s.habits.find((h) => h.id === id));
  const completionsOrNull = useHabitStore((s) => s.completions[id ?? ''] ?? null);
  const completions = useMemo(() => completionsOrNull ?? new Set<string>(), [completionsOrNull]);
  const toggleCompletion = useHabitStore((s) => s.toggleCompletion);
  const archiveHabit = useHabitStore((s) => s.archiveHabit);
  const updateHabit = useHabitStore((s) => s.updateHabit);
  const [editModalVisible, setEditModalVisible] = useState(false);

  const isCompleted = id ? selectIsCompletedToday(id, today) : false;
  const streak = id ? selectCurrentStreak(id, today) : { count: 0, includesFreeze: false };
  const longestStreak = id ? selectLongestStreak(id) : 0;

  const handleMarkDone = useCallback(async () => {
    if (!id) return;
    try {
      const db = getDatabase();
      await toggleCompletion(db, id, today);
      if (!isCompleted) {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      }
    } catch {
      // TODO: Show toast
    }
  }, [id, today, isCompleted, toggleCompletion]);

  const handleReminderChange = useCallback(async (time: string | null) => {
    if (!habit || !id) return;
    const db = getDatabase();
    try {
      if (habit.notificationId) {
        await cancelHabitReminder(habit.notificationId);
      }

      let newNotificationId: string | null = null;
      if (time) {
        const hasPermission = await requestNotificationPermissions();
        if (!hasPermission) {
          Alert.alert(
            'Permission Required',
            'Please enable notifications in Settings to use reminders.',
          );
          return;
        }
        newNotificationId = await scheduleHabitReminder(habit.name, time, habit.frequency);
      }

      await updateHabit(db, id, { reminderTime: time, notificationId: newNotificationId });
    } catch {
      Alert.alert('Error', 'Could not update reminder. Please try again.');
    }
  }, [id, habit, updateHabit]);

  const handleArchive = useCallback(() => {
    if (!id) return;
    Alert.alert(
      'Archive Habit',
      'This will hide the habit from your daily view. You can restore it from Settings.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Archive',
          style: 'destructive',
          onPress: async () => {
            try {
              const db = getDatabase();
              await archiveHabit(db, id);
              router.back();
            } catch {
              Alert.alert('Error', 'Something went wrong, try again.');
            }
          },
        },
      ]
    );
  }, [id, archiveHabit, router]);

  const last30Days = Array.from(eachDayBackward(today, 30));

  if (!habit || !id) {
    return (
      <View style={[styles.center, { backgroundColor: colors.background }]}>
        <Text style={[styles.errorText, { color: colors.textSecondary }]}>Habit not found</Text>
      </View>
    );
  }

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.background }]}
      contentContainerStyle={styles.content}
    >
      {/* Header */}
      <View style={styles.header}>
        <HabitIcon icon={habit.icon} size={80} bordered />
        <Text style={[styles.name, { color: colors.text }]}>{habit.name}</Text>
        <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
          Repeat everyday to form a habit
        </Text>
      </View>

      {/* Mark Done Button */}
      <Pressable
        style={[
          styles.markDoneButton,
          neo.shadow,
          {
            backgroundColor: isCompleted ? colors.pastelGreen : habit.color,
            borderColor: colors.border,
          },
        ]}
        onPress={handleMarkDone}
      >
        {isCompleted ? (
          <>
            <MaterialCommunityIcons name="check-circle" size={22} color={colors.text} />
            <Text style={[styles.markDoneText, { color: colors.text }]}>
              Done — Tap to Undo
            </Text>
          </>
        ) : (
          <Text style={[styles.markDoneText, { color: '#fff' }]}>Mark Done</Text>
        )}
      </Pressable>

      {/* Streaks */}
      <View style={styles.streakRow}>
        <StreakBadge count={streak.count} includesFreeze={streak.includesFreeze} label="Streak" />
        <StreakBadge count={longestStreak} includesFreeze={false} label="Longest" size="small" />
      </View>

      {/* Mini Calendar */}
      <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>
        LAST 30 DAYS
      </Text>
      <View
        style={[
          styles.miniCalendarCard,
          neo.shadow,
          { backgroundColor: colors.card, borderColor: colors.border },
        ]}
      >
        <View style={styles.miniCalendar}>
          {last30Days.map((date) => {
            const done = completions.has(date);
            return (
              <View
                key={date}
                style={[
                  styles.calendarDot,
                  {
                    backgroundColor: done ? habit.color : colors.background,
                    borderColor: colors.border + '30',
                    borderWidth: 1,
                  },
                ]}
              />
            );
          })}
        </View>
      </View>

      {/* Reminder */}
      <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>REMINDER</Text>
      <ReminderTimePicker value={habit.reminderTime} onChange={handleReminderChange} />

      {/* Edit button */}
      <Pressable
        style={[
          styles.actionButton,
          neo.shadowSm,
          { backgroundColor: colors.card, borderColor: colors.border },
        ]}
        onPress={() => setEditModalVisible(true)}
      >
        <MaterialCommunityIcons name="pencil" size={20} color={colors.text} />
        <Text style={[styles.actionText, { color: colors.text }]}>Edit Habit</Text>
      </Pressable>

      {/* Archive */}
      <Pressable
        style={[
          styles.actionButton,
          neo.shadowSm,
          { backgroundColor: colors.pastelPink, borderColor: colors.border },
        ]}
        onPress={handleArchive}
      >
        <MaterialCommunityIcons name="archive-outline" size={20} color={colors.text} />
        <Text style={[styles.actionText, { color: colors.text }]}>Archive Habit</Text>
      </Pressable>
      {editModalVisible && (
        <EditHabitModal habit={habit} onClose={() => setEditModalVisible(false)} />
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    padding: 20,
    paddingBottom: 40,
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  errorText: {
    fontSize: 16,
    fontWeight: '600',
  },
  header: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  name: {
    fontSize: 26,
    fontWeight: '900',
    marginTop: 14,
  },
  subtitle: {
    fontSize: 14,
    fontWeight: '500',
    marginTop: 4,
  },
  markDoneButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    paddingVertical: 18,
    borderRadius: 14,
    borderWidth: neo.borderWidth,
    marginVertical: 16,
  },
  markDoneText: {
    fontSize: 18,
    fontWeight: '800',
  },
  streakRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 12,
    paddingVertical: 12,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '800',
    letterSpacing: 1,
    marginTop: 20,
    marginBottom: 10,
    marginLeft: 4,
  },
  miniCalendarCard: {
    borderWidth: neo.borderWidth,
    borderRadius: neo.borderRadius,
    padding: 16,
  },
  miniCalendar: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  calendarDot: {
    width: 20,
    height: 20,
    borderRadius: 5,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    paddingVertical: 16,
    borderRadius: neo.borderRadiusSm,
    borderWidth: neo.borderWidth,
    marginTop: 12,
  },
  actionText: {
    fontSize: 16,
    fontWeight: '700',
  },
});
