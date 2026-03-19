import React, { useCallback, useState } from 'react';
import { FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useHabitStore } from '@/src/store/habitStore';
import { selectTodayHabits, selectTodayProgress, selectIsCompletedToday, selectCurrentStreak } from '@/src/store/selectors';
import { getToday, formatDate } from '@/src/utils/dates';
import { getDatabase } from '@/src/hooks/useBootLoader';
import { HabitCard } from '@/src/components/HabitCard';
import { ProgressRing } from '@/src/components/ProgressRing';
import { EmptyState } from '@/src/components/EmptyState';
import { PerfectDayBanner } from '@/src/components/PerfectDayBanner';
import { useThemeColors } from '@/src/hooks/useThemeColors';
import { neo } from '@/src/constants/theme';
import { subDays, addDays, parseISO } from 'date-fns';
import type { Habit } from '@/src/types';

export default function TodayScreen() {
  const router = useRouter();
  const colors = useThemeColors();
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
      // TODO: Show toast
    }
  }, [selectedDate, toggleCompletion]);

  const handleNavigateDay = useCallback((direction: -1 | 1) => {
    if (direction === 1 && isToday) return;
    const current = parseISO(selectedDate);
    const next = direction === -1 ? subDays(current, 1) : addDays(current, 1);
    const nextStr = formatDate(next);
    // Never go past today
    if (nextStr > getToday()) return;
    setSelectedDate(nextStr);
  }, [selectedDate, isToday]);

  const handleAddHabit = useCallback(() => {
    if (habits.length >= 15) return;
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
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Date navigation */}
      <View style={[styles.dateHeader, { borderColor: colors.border }]}>
        <Pressable onPress={() => handleNavigateDay(-1)} hitSlop={12}>
          <MaterialCommunityIcons name="chevron-left" size={28} color={colors.text} />
        </Pressable>
        <Pressable onPress={() => setSelectedDate(getToday())}>
          <Text style={[styles.dateText, { color: colors.text }]}>
            {isToday ? 'Today' : selectedDate}
          </Text>
        </Pressable>
        {!isToday && (
          <Pressable onPress={() => handleNavigateDay(1)} hitSlop={12}>
            <MaterialCommunityIcons name="chevron-right" size={28} color={colors.text} />
          </Pressable>
        )}
      </View>

      {/* Progress card */}
      <View style={styles.progressContainer}>
        <ProgressRing completed={progress.completed} total={progress.total} />
      </View>

      {/* Perfect day banner */}
      {isPerfectDay && <PerfectDayBanner />}

      {/* Section label */}
      <Text style={[styles.sectionLabel, { color: colors.textSecondary }]}>
        {isToday ? "TODAY'S TASKS" : 'TASKS'}
      </Text>

      {/* Habit list */}
      <FlatList
        data={todayHabits}
        keyExtractor={(item) => item.id}
        renderItem={renderHabitCard}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
      />

      {/* FAB */}
      <Pressable
        style={[
          styles.fab,
          neo.shadow,
          { backgroundColor: colors.text, borderColor: colors.border },
        ]}
        onPress={handleAddHabit}
      >
        <MaterialCommunityIcons name="plus" size={28} color={colors.card} />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  dateHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    gap: 20,
  },
  dateText: {
    fontSize: 20,
    fontWeight: '800',
  },
  progressContainer: {
    paddingVertical: 8,
  },
  sectionLabel: {
    fontSize: 13,
    fontWeight: '800',
    letterSpacing: 1,
    marginHorizontal: 20,
    marginTop: 16,
    marginBottom: 8,
  },
  list: {
    paddingTop: 4,
    paddingBottom: 100,
  },
  fab: {
    position: 'absolute',
    bottom: 24,
    right: 24,
    width: 56,
    height: 56,
    borderRadius: 28,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
