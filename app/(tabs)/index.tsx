import React, { useCallback, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import DraggableFlatList, { type RenderItemParams } from 'react-native-draggable-flatlist';
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
import { useToast } from '@/src/components/Toast';
import type { Habit } from '@/src/types';
import Animated, { useAnimatedStyle, withSpring, LinearTransition } from 'react-native-reanimated';

function DraggableHabitCard({
  habit,
  isCompleted,
  streakCount,
  onToggle,
  onPress,
  drag,
  isActive,
}: {
  habit: Habit;
  isCompleted: boolean;
  streakCount: number;
  onToggle: () => void;
  onPress: () => void;
  drag: () => void;
  isActive: boolean;
}) {
  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: withSpring(isActive ? 1.04 : 1, { damping: 20, stiffness: 200 }) }],
    opacity: withSpring(isActive ? 1 : 1, { damping: 20 }),
    shadowOffset: { width: isActive ? 5 : 3, height: isActive ? 5 : 3 },
    shadowOpacity: isActive ? 0.4 : 0,
    shadowRadius: isActive ? 0 : 0,
    zIndex: isActive ? 999 : 0,
  }));

  return (
    <Animated.View style={animatedStyle}>
      <HabitCard
        habit={habit}
        isCompleted={isCompleted}
        streakCount={streakCount}
        onToggle={onToggle}
        onPress={onPress}
        onLongPress={drag}
        disabled={isActive}
      />
    </Animated.View>
  );
}

export default function TodayScreen() {
  const router = useRouter();
  const colors = useThemeColors();
  const [selectedDate, setSelectedDate] = useState(getToday());
  const habits = useHabitStore((s) => s.habits);
  const completions = useHabitStore((s) => s.completions);
  const toggleCompletion = useHabitStore((s) => s.toggleCompletion);
  const reorderHabits = useHabitStore((s) => s.reorderHabits);

  const { showToast } = useToast();
  const todayHabits = selectTodayHabits(selectedDate);
  const progress = selectTodayProgress(selectedDate);
  const isToday = selectedDate === getToday();
  const isPerfectDay = progress.total > 0 && progress.completed === progress.total;

  const handleToggle = useCallback(async (habitId: string) => {
    try {
      const db = getDatabase();
      await toggleCompletion(db, habitId, selectedDate);
    } catch {
      showToast('Could not update habit. Please try again.');
    }
  }, [selectedDate, toggleCompletion, showToast]);

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

  const handleDragEnd = useCallback(async ({ data }: { data: Habit[] }) => {
    try {
      const db = getDatabase();
      const orderedIds = data.map((h) => h.id);
      await reorderHabits(db, orderedIds);
    } catch {
      showToast('Could not reorder habits. Please try again.');
    }
  }, [reorderHabits, showToast]);

  const renderHabitCard = useCallback(({ item, drag, isActive }: RenderItemParams<Habit>) => {
    const isCompleted = selectIsCompletedToday(item.id, selectedDate);
    const streak = selectCurrentStreak(item.id, selectedDate);
    return (
      <DraggableHabitCard
        habit={item}
        isCompleted={isCompleted}
        streakCount={streak.count}
        onToggle={() => handleToggle(item.id)}
        onPress={() => router.push(`/habit/${item.id}`)}
        drag={drag}
        isActive={isActive}
      />
    );
  }, [selectedDate, handleToggle, router, completions]);

  if (habits.length === 0) {
    return <EmptyState onAddHabit={handleAddHabit} />;
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
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
        <Pressable
          onPress={() => handleNavigateDay(1)}
          hitSlop={12}
          disabled={isToday}
          style={{ opacity: isToday ? 0.2 : 1 }}
        >
          <MaterialCommunityIcons name="chevron-right" size={28} color={colors.text} />
        </Pressable>
      </View>

      {/* Progress card */}
      <View style={styles.progressContainer}>
        <ProgressRing completed={progress.completed} total={progress.total} />
      </View>

      {/* Perfect day banner */}
      {isPerfectDay && <PerfectDayBanner />}

      {/* Section label */}
      <Animated.View layout={LinearTransition.springify().damping(20).stiffness(120)}>
        <Text style={[styles.sectionLabel, { color: colors.textSecondary }]}>
          {isToday ? "TODAY'S TASKS" : 'TASKS'}
        </Text>
      </Animated.View>

      {/* Habit list — draggable only on Today view */}
      <Animated.View
        layout={LinearTransition.springify().damping(20).stiffness(120)}
        style={styles.dragContainer}
      >
        <DraggableFlatList
          data={todayHabits}
          keyExtractor={(item) => item.id}
          renderItem={renderHabitCard}
          onDragEnd={handleDragEnd}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          activationDistance={isToday ? 0 : 999}
          containerStyle={{ flex: 1 }}
        />
      </Animated.View>

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
    </SafeAreaView>
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
  dragContainer: {
    flex: 1,
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
