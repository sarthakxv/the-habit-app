import React, { useCallback, useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { format, subMonths, addMonths, eachDayOfInterval, startOfMonth, endOfMonth } from 'date-fns';
import { useHabitStore } from '@/src/store/habitStore';
import { isHabitScheduledForDate } from '@/src/utils/dates';
import { CalendarHeatmap } from '@/src/components/CalendarHeatmap';

export default function CalendarScreen() {
  const [currentMonth, setCurrentMonth] = useState(format(new Date(), 'yyyy-MM'));
  const [selectedDate, setSelectedDate] = useState<string | null>(null);

  const habits = useHabitStore((s) => s.habits);
  const completions = useHabitStore((s) => s.completions);

  // Compute completion percentage per day for the month
  const completionData = useMemo(() => {
    const monthStart = startOfMonth(new Date(currentMonth + '-01'));
    const monthEnd = endOfMonth(monthStart);
    const days = eachDayOfInterval({ start: monthStart, end: monthEnd });
    const data: Record<string, number> = {};

    for (const day of days) {
      const dateStr = format(day, 'yyyy-MM-dd');
      const scheduled = habits.filter((h) => isHabitScheduledForDate(h.frequency, dateStr));
      if (scheduled.length === 0) {
        data[dateStr] = 0;
        continue;
      }
      const completed = scheduled.filter((h) => completions[h.id]?.has(dateStr)).length;
      data[dateStr] = completed / scheduled.length;
    }

    return data;
  }, [currentMonth, habits, completions]);

  // Day detail: which habits were completed/missed
  const dayDetail = useMemo(() => {
    if (!selectedDate) return null;
    const scheduled = habits.filter((h) => isHabitScheduledForDate(h.frequency, selectedDate));
    return scheduled.map((h) => ({
      habit: h,
      completed: completions[h.id]?.has(selectedDate) ?? false,
    }));
  }, [selectedDate, habits, completions]);

  const handlePrevMonth = useCallback(() => {
    setCurrentMonth((m) => format(subMonths(new Date(m + '-01'), 1), 'yyyy-MM'));
    setSelectedDate(null);
  }, []);

  const handleNextMonth = useCallback(() => {
    setCurrentMonth((m) => format(addMonths(new Date(m + '-01'), 1), 'yyyy-MM'));
    setSelectedDate(null);
  }, []);

  const monthLabel = format(new Date(currentMonth + '-01'), 'MMMM yyyy');

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Month navigation */}
      <View style={styles.monthHeader}>
        <Pressable onPress={handlePrevMonth} hitSlop={12}>
          <Text style={styles.arrow}>‹</Text>
        </Pressable>
        <Text style={styles.monthText}>{monthLabel}</Text>
        <Pressable onPress={handleNextMonth} hitSlop={12}>
          <Text style={styles.arrow}>›</Text>
        </Pressable>
      </View>

      {/* Heatmap */}
      <CalendarHeatmap
        month={currentMonth}
        completionData={completionData}
        onDayPress={setSelectedDate}
      />

      {/* Day detail */}
      {selectedDate && dayDetail && (
        <View style={styles.detail}>
          <Text style={styles.detailTitle}>{selectedDate}</Text>
          {dayDetail.length === 0 ? (
            <Text style={styles.detailEmpty}>No habits scheduled</Text>
          ) : (
            dayDetail.map(({ habit, completed }) => (
              <View key={habit.id} style={styles.detailRow}>
                <Text style={styles.detailIcon}>{habit.icon}</Text>
                <Text style={[styles.detailName, completed && styles.detailCompleted]}>
                  {habit.name}
                </Text>
                <Text style={completed ? styles.checkmark : styles.miss}>
                  {completed ? '✓' : '✗'}
                </Text>
              </View>
            ))
          )}
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  content: {
    paddingBottom: 40,
  },
  monthHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    gap: 20,
  },
  arrow: {
    fontSize: 28,
    color: '#666',
    paddingHorizontal: 8,
  },
  monthText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  detail: {
    marginTop: 16,
    marginHorizontal: 16,
    padding: 16,
    backgroundColor: '#f9f9f9',
    borderRadius: 12,
  },
  detailTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#333',
    marginBottom: 12,
  },
  detailEmpty: {
    color: '#999',
    fontSize: 14,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
  },
  detailIcon: {
    fontSize: 18,
    marginRight: 8,
  },
  detailName: {
    flex: 1,
    fontSize: 15,
    color: '#333',
  },
  detailCompleted: {
    textDecorationLine: 'line-through',
    color: '#999',
  },
  checkmark: {
    fontSize: 16,
    color: '#4CAF50',
    fontWeight: 'bold',
  },
  miss: {
    fontSize: 16,
    color: '#F44336',
  },
});
