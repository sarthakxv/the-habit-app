import React, { useCallback } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { useHabitStore } from '@/src/store/habitStore';
import { selectCurrentStreak, selectLongestStreak, selectIsCompletedToday } from '@/src/store/selectors';
import { getToday } from '@/src/utils/dates';
import { getDatabase } from '@/src/hooks/useBootLoader';
import { StreakBadge } from '@/src/components/StreakBadge';
import { eachDayBackward } from '@/src/utils/dates';

export default function HabitDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const today = getToday();

  const habit = useHabitStore((s) => s.habits.find((h) => h.id === id));
  const completions = useHabitStore((s) => s.completions[id ?? ''] ?? new Set());
  const toggleCompletion = useHabitStore((s) => s.toggleCompletion);
  const archiveHabit = useHabitStore((s) => s.archiveHabit);

  if (!habit || !id) {
    return (
      <View style={styles.center}>
        <Text style={styles.errorText}>Habit not found</Text>
      </View>
    );
  }

  const isCompleted = selectIsCompletedToday(id, today);
  const streak = selectCurrentStreak(id, today);
  const longestStreak = selectLongestStreak(id);

  const handleMarkDone = useCallback(async () => {
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

  const handleArchive = useCallback(() => {
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

  // Mini calendar: last 30 days
  const last30Days = Array.from(eachDayBackward(today, 30));

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.icon}>{habit.icon}</Text>
        <Text style={styles.name}>{habit.name}</Text>
      </View>

      {/* Mark Done Button */}
      <Pressable
        style={[styles.markDoneButton, { backgroundColor: isCompleted ? '#E0E0E0' : habit.color }]}
        onPress={handleMarkDone}
      >
        <Text style={[styles.markDoneText, isCompleted && { color: '#666' }]}>
          {isCompleted ? '✓ Done — Tap to Undo' : 'Mark Done'}
        </Text>
      </Pressable>

      {/* Streaks */}
      <View style={styles.streakRow}>
        <StreakBadge count={streak.count} includesFreeze={streak.includesFreeze} label="Current Streak" />
        <StreakBadge count={longestStreak} includesFreeze={false} label="Longest Streak" size="small" />
      </View>

      {/* Mini Calendar */}
      <Text style={styles.sectionTitle}>Last 30 Days</Text>
      <View style={styles.miniCalendar}>
        {last30Days.map((date) => {
          const done = completions.has(date);
          return (
            <View
              key={date}
              style={[
                styles.calendarDot,
                done && { backgroundColor: habit.color },
              ]}
            />
          );
        })}
      </View>

      {/* Edit button */}
      <Pressable style={styles.editButton} onPress={() => {/* TODO: Edit modal */}}>
        <Text style={styles.editText}>Edit Habit</Text>
      </Pressable>

      {/* Archive */}
      <Pressable style={styles.archiveButton} onPress={handleArchive}>
        <Text style={styles.archiveText}>Archive Habit</Text>
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
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
    color: '#666',
  },
  header: {
    alignItems: 'center',
    paddingVertical: 16,
  },
  icon: {
    fontSize: 48,
    marginBottom: 8,
  },
  name: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1a1a1a',
  },
  markDoneButton: {
    paddingVertical: 18,
    borderRadius: 14,
    alignItems: 'center',
    marginVertical: 16,
  },
  markDoneText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '700',
  },
  streakRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: 20,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#333',
    marginTop: 16,
    marginBottom: 8,
  },
  miniCalendar: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 4,
  },
  calendarDot: {
    width: 18,
    height: 18,
    borderRadius: 4,
    backgroundColor: '#eee',
  },
  editButton: {
    paddingVertical: 14,
    borderRadius: 10,
    backgroundColor: '#f0f0f0',
    alignItems: 'center',
    marginTop: 24,
  },
  editText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  archiveButton: {
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 12,
  },
  archiveText: {
    fontSize: 16,
    color: '#F44336',
  },
});
