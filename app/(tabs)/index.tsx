import React, { useCallback, useState } from 'react';
import { FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useHabitStore } from '@/src/store/habitStore';
import { selectTodayHabits, selectTodayProgress, selectIsCompletedToday, selectCurrentStreak } from '@/src/store/selectors';
import { getToday, formatDate } from '@/src/utils/dates';
import { getDatabase } from '@/src/hooks/useBootLoader';
import { HabitCard } from '@/src/components/HabitCard';
import { ProgressRing } from '@/src/components/ProgressRing';
import { EmptyState } from '@/src/components/EmptyState';
import { PerfectDayBanner } from '@/src/components/PerfectDayBanner';
import { subDays, addDays, parseISO } from 'date-fns';
import type { Habit } from '@/src/types';

export default function TodayScreen() {
  const router = useRouter();
  const [selectedDate, setSelectedDate] = useState(getToday());
  const habits = useHabitStore((s) => s.habits);
  const completions = useHabitStore((s) => s.completions);
  const toggleCompletion = useHabitStore((s) => s.toggleCompletion);

  const todayHabits = selectTodayHabits(selectedDate);
  const progress = selectTodayProgress(selectedDate);
  const isToday = selectedDate === getToday();
  const isPerfectDay = progress.total > 0 && progress.completed === progress.total;

  const handleToggle = useCallback(async (habitId: string) => {
    try {
      const db = getDatabase();
      await toggleCompletion(db, habitId, selectedDate);
    } catch {
      // TODO: Show toast "Something went wrong, try again"
    }
  }, [selectedDate, toggleCompletion]);

  const handleNavigateDay = useCallback((direction: -1 | 1) => {
    const current = parseISO(selectedDate);
    const next = direction === -1 ? subDays(current, 1) : addDays(current, 1);
    setSelectedDate(formatDate(next));
  }, [selectedDate]);

  const handleAddHabit = useCallback(() => {
    if (habits.length >= 15) {
      // TODO: Show toast "Delete a habit to add a new one"
      return;
    }
    router.push('/habit/new');
  }, [habits.length, router]);

  const renderHabitCard = useCallback(({ item }: { item: Habit }) => {
    const isCompleted = selectIsCompletedToday(item.id, selectedDate);
    const streak = selectCurrentStreak(item.id, selectedDate);
    return (
      <HabitCard
        habit={item}
        isCompleted={isCompleted}
        streakCount={streak.count}
        onToggle={() => handleToggle(item.id)}
        onPress={() => router.push(`/habit/${item.id}`)}
      />
    );
  }, [selectedDate, handleToggle, router]);

  if (habits.length === 0) {
    return <EmptyState onAddHabit={handleAddHabit} />;
  }

  return (
    <View style={styles.container}>
      {/* Date header */}
      <View style={styles.dateHeader}>
        <Pressable onPress={() => handleNavigateDay(-1)} hitSlop={12}>
          <Text style={styles.arrow}>‹</Text>
        </Pressable>
        <Pressable onPress={() => setSelectedDate(getToday())}>
          <Text style={styles.dateText}>
            {isToday ? 'Today' : selectedDate}
          </Text>
        </Pressable>
        <Pressable onPress={() => handleNavigateDay(1)} hitSlop={12}>
          <Text style={styles.arrow}>›</Text>
        </Pressable>
      </View>

      {/* Progress */}
      <View style={styles.progressContainer}>
        <ProgressRing completed={progress.completed} total={progress.total} />
      </View>

      {/* Perfect day banner */}
      {isPerfectDay && <PerfectDayBanner />}

      {/* Habit list */}
      <FlatList
        data={todayHabits}
        keyExtractor={(item) => item.id}
        renderItem={renderHabitCard}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
      />

      {/* FAB */}
      <Pressable style={styles.fab} onPress={handleAddHabit}>
        <Text style={styles.fabText}>+</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fafafa',
  },
  dateHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    gap: 20,
  },
  arrow: {
    fontSize: 28,
    color: '#666',
    paddingHorizontal: 8,
  },
  dateText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  progressContainer: {
    alignItems: 'center',
    paddingVertical: 8,
  },
  list: {
    paddingTop: 8,
    paddingBottom: 100,
  },
  fab: {
    position: 'absolute',
    bottom: 24,
    right: 24,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#4CAF50',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  fabText: {
    fontSize: 28,
    color: '#fff',
    lineHeight: 30,
  },
});
